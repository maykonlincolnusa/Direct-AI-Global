import { ConnectorContext, ConnectorSyncResult, ISourceConnector, SourceRecord } from './types';
import { detectWebsitePagesFromSitemap, pageChecksum, parseWebsitePage } from './website-reader-parser';
import { fetchText } from '../utils/http';
import { generateId } from '../utils/id';

export interface WebsiteReaderConnectorOptions {
  baseUrl: string;
  maxPages?: number;
}

export class WebsiteReaderConnector implements ISourceConnector {
  readonly type = 'website_reader' as const;

  constructor(readonly id: string, private readonly options: WebsiteReaderConnectorOptions) {}

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    const baseUrl = this.options.baseUrl.replace(/\/+$/, '');
    const maxPages = this.options.maxPages ?? 20;
    const discoveredPages = await this.discoverPages(baseUrl, maxPages);
    const records: SourceRecord[] = [];

    for (const pageUrl of discoveredPages) {
      try {
        const html = await fetchText(pageUrl);
        const parsed = parseWebsitePage(pageUrl, html);
        records.push({
          id: generateId(),
          tenantId: context.tenantId,
          sourceType: this.type,
          sourceId: this.id,
          collectedAt: new Date().toISOString(),
          payload: parsed as unknown as Record<string, unknown>,
          metadata: {
            checksum: pageChecksum(parsed),
            tags: ['website', 'institutional'],
            priority: 5
          }
        });
      } catch {
        continue;
      }
    }

    return {
      records,
      health: records.length > 0 ? 'ok' : 'degraded'
    };
  }

  private async discoverPages(baseUrl: string, maxPages: number) {
    const pages = new Set<string>([baseUrl]);
    const sitemapCandidates = [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap_index.xml`];

    for (const sitemapUrl of sitemapCandidates) {
      try {
        const xml = await fetchText(sitemapUrl, 8000);
        for (const url of detectWebsitePagesFromSitemap(xml, maxPages)) {
          pages.add(url);
          if (pages.size >= maxPages) break;
        }
      } catch {
        continue;
      }
      if (pages.size >= maxPages) break;
    }

    return [...pages].slice(0, maxPages);
  }
}
