import { resolve } from 'node:path';
import { v5 as uuidv5 } from 'uuid';
import { detectAuthor, detectLanguage, classifyDomain, classifyType } from '../classifiers/semantic-classifier';
import { ContentExtractor } from '../extractors/content-extractor';
import { detectFileType } from '../extractors/file-type';
import { FileChunkRepository, FileKnowledgeRepository, FileMetadataRepository } from '../repositories/file-repositories';
import { PIPELINE_CONFIG, PIPELINE_PATHS } from './config';
import { markSimilarDocuments } from './deduplication';
import { buildMetadata } from './metadata';
import { chunkText } from './chunker';
import { buildFinalReport } from './report';
import { buildTaxonomy } from './taxonomy';
import type { DocumentMetadata, FinalReport, IngestionState } from './types';
import { ensureDirectories, fileExists, fileHash, fileSize, listFilesRecursively, normalizeSourcePath, readJson, writeJson } from '../utils/io';
import { PipelineLogger } from '../utils/logger';
import { sanitizeText } from '../utils/text';

const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

type Counters = {
  processed: number;
  skipped: number;
  unsupported: number;
  errors: number;
  fileTypes: Record<string, number>;
};

export class KnowledgeIngestionPipeline {
  private readonly extractor = new ContentExtractor();
  private readonly logger = new PipelineLogger();
  private readonly knowledgeRepository = new FileKnowledgeRepository();
  private readonly chunkRepository = new FileChunkRepository();
  private readonly metadataRepository = new FileMetadataRepository();

  async run(): Promise<FinalReport> {
    const startedAt = Date.now();
    await ensureDirectories([
      PIPELINE_PATHS.raw,
      PIPELINE_PATHS.processed,
      PIPELINE_PATHS.chunks,
      PIPELINE_PATHS.metadata,
      PIPELINE_PATHS.embeddings,
      PIPELINE_PATHS.taxonomy,
      PIPELINE_PATHS.kbLogs,
      PIPELINE_PATHS.logs
    ]);

    const state = await readJson<IngestionState>(PIPELINE_PATHS.stateFile, { bySourcePath: {} });
    const files = await listFilesRecursively(PIPELINE_PATHS.raw);
    const counters: Counters = {
      processed: 0,
      skipped: 0,
      unsupported: 0,
      errors: 0,
      fileTypes: {}
    };

    await this.logger.info(`Ingestion started. Files discovered: ${files.length}`);

    for (const batch of toBatches(files, PIPELINE_CONFIG.batchSize)) {
      await Promise.all(batch.map((filePath) => this.processFile(filePath, state, counters)));
    }

    await writeJson(PIPELINE_PATHS.stateFile, state);

    const allMetadata = await this.metadataRepository.listAllMetadata();
    await this.applyDuplicateDetection(allMetadata);
    const metadataAfterDedup = await this.metadataRepository.listAllMetadata();
    const taxonomy = buildTaxonomy(metadataAfterDedup);
    await writeJson(PIPELINE_PATHS.taxonomyFile, taxonomy);

    const totalChunks = await this.countChunks(metadataAfterDedup.map((entry) => entry.id));
    const report = buildFinalReport({
      metadata: metadataAfterDedup,
      chunksCount: totalChunks,
      fileTypes: counters.fileTypes,
      processed: counters.processed,
      skipped: counters.skipped,
      unsupported: counters.unsupported,
      errors: counters.errors,
      startedAt
    });

    await writeJson(PIPELINE_PATHS.reportFile, report);
    await this.logger.info(
      `Ingestion finished. processed=${report.processados} skipped=${report.ignorados_idempotencia} unsupported=${report.nao_suportados} errors=${report.erros}`
    );

    return report;
  }

  private async processFile(filePath: string, state: IngestionState, counters: Counters) {
    const sourceRelative = normalizeSourcePath(filePath, PIPELINE_PATHS.root);
    const fileType = detectFileType(filePath);

    if (!fileType) {
      counters.unsupported += 1;
      await this.logger.unsupported(sourceRelative);
      return;
    }
    counters.fileTypes[fileType] = (counters.fileTypes[fileType] ?? 0) + 1;

    try {
      const hash = await fileHash(filePath);
      const existing = state.bySourcePath[sourceRelative];
      const id = existing?.id ?? uuidv5(sourceRelative, UUID_NAMESPACE);

      const [processedExists, metadataExists, chunksExists] = await Promise.all([
        fileExists(resolve(PIPELINE_PATHS.processed, `${id}.txt`)),
        fileExists(resolve(PIPELINE_PATHS.metadata, `${id}.json`)),
        fileExists(resolve(PIPELINE_PATHS.chunks, `${id}.json`))
      ]);

      if (
        existing &&
        existing.hash === hash &&
        processedExists &&
        metadataExists &&
        chunksExists
      ) {
        counters.skipped += 1;
        await this.logger.info(`Skipping unchanged file: ${sourceRelative}`);
        return;
      }

      const extracted = await this.extractor.extract(filePath, fileType);
      const text = sanitizeText(extracted);

      if (!text) {
        counters.errors += 1;
        await this.logger.error(`Empty content: ${sourceRelative}`);
        return;
      }

      const [sizeBytes, domain, type, author, language] = await Promise.all([
        fileSize(filePath),
        Promise.resolve(classifyDomain(text)),
        Promise.resolve(classifyType(text)),
        Promise.resolve(detectAuthor(text)),
        Promise.resolve(detectLanguage(text))
      ]);

      await this.knowledgeRepository.saveProcessedDocument({
        id,
        sourcePath: sourceRelative,
        sourceSizeBytes: sizeBytes,
        text,
        fileType
      });

      const metadata = buildMetadata({
        id,
        text,
        domain,
        type,
        author,
        language,
        sizeBytes,
        sourcePath: sourceRelative
      });

      const chunks = chunkText(
        id,
        text,
        metadata.dominio,
        metadata.tipo,
        PIPELINE_CONFIG.minChunkTokens,
        PIPELINE_CONFIG.maxChunkTokens
      );

      await Promise.all([
        this.metadataRepository.saveMetadata(metadata),
        this.chunkRepository.saveChunks(id, chunks)
      ]);

      state.bySourcePath[sourceRelative] = {
        id,
        sourcePath: sourceRelative,
        hash,
        lastProcessedAt: new Date().toISOString()
      };

      counters.processed += 1;
      await this.logger.info(`Processed ${sourceRelative} -> ${id} (${chunks.length} chunks)`);
    } catch (error) {
      counters.errors += 1;
      await this.logger.error(
        `Error processing ${sourceRelative}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async applyDuplicateDetection(metadataList: DocumentMetadata[]) {
    const docsForSimilarity = await Promise.all(
      metadataList.map(async (metadata) => ({
        id: metadata.id,
        dominio: metadata.dominio,
        idioma: metadata.idioma,
        text: await this.knowledgeRepository.readProcessedDocument(metadata.id),
        metadata
      }))
    );

    const similarityMap = markSimilarDocuments(
      docsForSimilarity,
      PIPELINE_CONFIG.dedupeSimilarityThreshold
    );

    await Promise.all(
      metadataList.map(async (metadata) => {
        const similar = similarityMap[metadata.id] ?? [];
        metadata.similar_docs = similar;
        await this.metadataRepository.saveMetadata(metadata);
      })
    );
  }

  private async countChunks(documentIds: string[]) {
    let total = 0;
    for (const id of documentIds) {
      const chunks = await this.chunkRepository.readChunks(id);
      total += chunks.length;
    }
    return total;
  }
}

function toBatches<T>(items: T[], batchSize: number) {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    output.push(items.slice(index, index + batchSize));
  }
  return output;
}
