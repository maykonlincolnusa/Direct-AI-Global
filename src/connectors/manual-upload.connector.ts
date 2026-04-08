import { resolve } from 'node:path';
import { ConnectorContext, ConnectorSyncResult, ISourceConnector, SourceRecord } from './types';
import { FileMediaIngestionService } from '../ingestion/file-media-ingestion';
import { generateId, hashString } from '../utils/id';

export interface ManualUploadConnectorOptions {
  filePaths: string[];
}

export class ManualUploadConnector implements ISourceConnector {
  readonly type = 'manual_upload' as const;
  private readonly ingestion = new FileMediaIngestionService();

  constructor(readonly id: string, private readonly options: ManualUploadConnectorOptions) {}

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    const records: SourceRecord[] = [];

    for (const filePath of this.options.filePaths) {
      const absolutePath = resolve(filePath);
      const ingested = await this.ingestion.ingest(absolutePath);
      if (!ingested) continue;

      const payload = {
        file: {
          fileName: ingested.fileName,
          mimeType: ingested.mimeType,
          sizeBytes: ingested.sizeBytes,
          checksum: ingested.checksum,
          storagePath: ingested.storagePath
        },
        documentText: ingested.extractedText ?? ''
      };

      records.push({
        id: generateId(),
        tenantId: context.tenantId,
        sourceType: this.type,
        sourceId: this.id,
        collectedAt: new Date().toISOString(),
        payload: payload as unknown as Record<string, unknown>,
        metadata: {
          checksum: hashString(JSON.stringify(payload)),
          cursor: context.cursor,
          priority: 7,
          tags: ['manual', 'file']
        }
      });
    }

    return {
      records,
      health: records.length > 0 ? 'ok' : 'degraded'
    };
  }
}
