import { ISourceConnector, SourceRecord } from '../connectors/types';
import { ContextNormalizer } from './context-normalizer';
import { TenantKnowledgeBase } from '../knowledge_base/in-memory-knowledge-base';
import { ContextStorage } from '../storage/context-storage';
import { IntegrationRegistry } from '../registry/integration-registry';
import { fingerprintPayload, generateId } from '../utils/id';
import { ConsoleLogger, Logger } from '../utils/logger';
import { CanonicalEntity } from '../models/canonical';

export interface SyncExecutionSummary {
  tenantId: string;
  connectorId: string;
  connectorType: string;
  runId: string;
  contextVersion: string;
  recordsReceived: number;
  recordsProcessed: number;
  entitiesGenerated: number;
  skippedDuplicates: number;
}

export class ContextIngestionPipeline {
  private readonly normalizer = new ContextNormalizer();

  constructor(
    private readonly storage: ContextStorage,
    private readonly registry: IntegrationRegistry,
    private readonly knowledgeBase: TenantKnowledgeBase,
    private readonly logger: Logger = new ConsoleLogger()
  ) {}

  async execute(tenantId: string, connector: ISourceConnector, cursor?: string): Promise<SyncExecutionSummary> {
    const runId = generateId();
    const contextVersion = `ctx-${Date.now()}`;
    const sync = await connector.sync({
      tenantId,
      connectorId: connector.id,
      runId,
      cursor
    });

    let processed = 0;
    let generatedEntities = 0;
    let skippedDuplicates = 0;

    for (const record of sync.records) {
      this.validateRecord(record, tenantId, connector);
      const fingerprint = fingerprintPayload({
        source: `${record.sourceType}:${record.sourceId}`,
        checksum: record.metadata.checksum
      });

      const alreadyProcessed = await this.storage.isFingerprintProcessed(tenantId, fingerprint);
      if (alreadyProcessed) {
        skippedDuplicates += 1;
        continue;
      }

      await this.storage.saveRawRecord(record);
      const entities = this.normalizer.normalize(record);
      await this.storage.saveCanonicalEntities(tenantId, entities);
      await this.indexEntitiesAsKnowledge(tenantId, entities);
      await this.storage.registerFingerprint(tenantId, fingerprint);

      processed += 1;
      generatedEntities += entities.length;
    }

    await this.storage.saveContextVersion(tenantId, contextVersion);
    await this.storage.appendAuditLog(tenantId, {
      type: 'ingestion.sync',
      connectorId: connector.id,
      connectorType: connector.type,
      runId,
      contextVersion,
      recordsReceived: sync.records.length,
      recordsProcessed: processed
    });

    await this.registry.updateSyncStatus({
      tenantId,
      connectorId: connector.id,
      cursor: sync.nextCursor,
      health: sync.health
    });

    this.logger.info('connector sync completed', {
      tenantId,
      connectorId: connector.id,
      connectorType: connector.type,
      runId,
      recordsReceived: sync.records.length,
      recordsProcessed: processed,
      entitiesGenerated: generatedEntities,
      skippedDuplicates
    });

    return {
      tenantId,
      connectorId: connector.id,
      connectorType: connector.type,
      runId,
      contextVersion,
      recordsReceived: sync.records.length,
      recordsProcessed: processed,
      entitiesGenerated: generatedEntities,
      skippedDuplicates
    };
  }

  private validateRecord(record: SourceRecord, tenantId: string, connector: ISourceConnector) {
    if (record.tenantId !== tenantId) {
      throw new Error(`Record tenant mismatch. expected=${tenantId}, got=${record.tenantId}`);
    }
    if (record.sourceType !== connector.type) {
      throw new Error(`Record sourceType mismatch. expected=${connector.type}, got=${record.sourceType}`);
    }
    if (!record.metadata?.checksum) {
      throw new Error('Invalid source record: checksum is required');
    }
  }

  private async indexEntitiesAsKnowledge(tenantId: string, entities: CanonicalEntity[]) {
    for (const entity of entities) {
      const title = `${entity.entityType} from ${entity.source}`;
      const content = `${title}\n${JSON.stringify(entity.attributes, null, 2)}`;
      await this.knowledgeBase.upsert({
        tenantId,
        source: entity.source,
        title,
        content,
        metadata: {
          entityType: entity.entityType,
          source: entity.source,
          updatedAt: entity.updatedAt
        }
      });
    }
  }
}
