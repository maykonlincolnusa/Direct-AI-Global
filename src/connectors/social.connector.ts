import { ConnectorContext, ConnectorSyncResult, ISourceConnector } from './types';
import { generateId, hashString } from '../utils/id';
import { fetchText } from '../utils/http';

export interface SocialConnectorOptions {
  provider?: 'rss';
  feedUrl: string;
  network?: string;
  limit?: number;
}

export class SocialConnector implements ISourceConnector {
  readonly type = 'social' as const;
  private readonly provider: 'rss';
  private readonly feedUrl: string;
  private readonly network: string;
  private readonly limit: number;

  constructor(readonly id: string, private readonly options: SocialConnectorOptions) {
    this.provider = options.provider ?? 'rss';
    this.feedUrl = options.feedUrl;
    this.network = options.network ?? 'social';
    this.limit = Number(options.limit ?? 20);
  }

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    if (this.provider !== 'rss' || !this.feedUrl) {
      return {
        health: 'degraded',
        records: []
      };
    }

    const xml = await fetchText(this.feedUrl, 12000);
    const posts = parseFeed(xml, this.network, this.limit);
    const payload = {
      provider: this.provider,
      posts,
      campaigns: []
    };

    return {
      health: posts.length > 0 ? 'ok' : 'degraded',
      records: [
        {
          id: generateId(),
          tenantId: context.tenantId,
          sourceType: this.type,
          sourceId: this.id,
          collectedAt: new Date().toISOString(),
          payload: payload as Record<string, unknown>,
          metadata: {
            checksum: hashString(JSON.stringify(payload)),
            cursor: context.cursor,
            priority: 6,
            tags: ['digital', 'social', this.provider]
          }
        }
      ]
    };
  }
}

function parseFeed(xml: string, network: string, limit: number) {
  const itemBlocks = matchBlocks(xml, 'item');
  const entryBlocks = matchBlocks(xml, 'entry');
  const blocks = (itemBlocks.length > 0 ? itemBlocks : entryBlocks).slice(0, limit);

  return blocks.map((block) => ({
    network,
    content:
      readTag(block, 'title') ||
      readTag(block, 'description') ||
      readTag(block, 'summary') ||
      'Untitled social item',
    publishedAt:
      readTag(block, 'pubDate') ||
      readTag(block, 'published') ||
      readTag(block, 'updated') ||
      new Date().toISOString(),
    engagement: 0
  }));
}

function matchBlocks(xml: string, tag: string) {
  const matches = [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))];
  return matches.map((match) => match[1]);
}

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!match) return '';
  return decodeXml(match[1]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
