import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SourceRecord } from '../connectors/types';
import { CanonicalEntity } from '../models/canonical';

const STORAGE_ROOT = resolve('.direct-context-data');

export class ContextStorage {
  async saveRawRecord(record: SourceRecord) {
    const target = this.pathFor(record.tenantId, 'raw.ndjson');
    await this.appendJsonLine(target, record);
  }

  async saveCanonicalEntities(tenantId: string, entities: CanonicalEntity[]) {
    const target = this.pathFor(tenantId, 'canonical.ndjson');
    for (const entity of entities) {
      await this.appendJsonLine(target, entity);
    }
  }

  async listCanonicalEntities(tenantId: string) {
    const target = this.pathFor(tenantId, 'canonical.ndjson');
    return this.readJsonLines<CanonicalEntity>(target);
  }

  async isFingerprintProcessed(tenantId: string, fingerprint: string) {
    const target = this.pathFor(tenantId, 'fingerprints.json');
    const data = await this.readJson<Record<string, true>>(target, {});
    return Boolean(data[fingerprint]);
  }

  async registerFingerprint(tenantId: string, fingerprint: string) {
    const target = this.pathFor(tenantId, 'fingerprints.json');
    const data = await this.readJson<Record<string, true>>(target, {});
    data[fingerprint] = true;
    await this.writeJson(target, data);
  }

  async saveContextVersion(tenantId: string, version: string) {
    const target = this.pathFor(tenantId, 'versions.ndjson');
    await this.appendJsonLine(target, {
      version,
      updatedAt: new Date().toISOString()
    });
  }

  async getLatestContextVersion(tenantId: string) {
    const target = this.pathFor(tenantId, 'versions.ndjson');
    const lines = await this.readJsonLines<{ version: string }>(target);
    return lines.at(-1)?.version;
  }

  async appendAuditLog(tenantId: string, event: Record<string, unknown>) {
    const target = this.pathFor(tenantId, 'audit.ndjson');
    await this.appendJsonLine(target, {
      ...event,
      at: new Date().toISOString()
    });
  }

  private pathFor(tenantId: string, fileName: string) {
    return resolve(STORAGE_ROOT, tenantId, fileName);
  }

  private async appendJsonLine(path: string, content: unknown) {
    await mkdir(dirname(path), { recursive: true });
    await appendFile(path, `${JSON.stringify(content)}\n`, 'utf8');
  }

  private async readJsonLines<T>(path: string) {
    try {
      const raw = await readFile(path, 'utf8');
      return raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as T);
    } catch {
      return [] as T[];
    }
  }

  private async readJson<T>(path: string, fallback: T) {
    try {
      const raw = await readFile(path, 'utf8');
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private async writeJson(path: string, content: unknown) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(content, null, 2), 'utf8');
  }
}
