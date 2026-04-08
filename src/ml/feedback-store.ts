import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { generateId } from '../utils/id';

export interface FeedbackRecord {
  id: string;
  tenantId: string;
  question: string;
  answer: string;
  helpful: boolean;
  notes?: string;
  createdAt: string;
}

const ROOT = resolve('.direct-context-data', 'ml', 'feedback');

export class FeedbackStore {
  async record(tenantId: string, input: Omit<FeedbackRecord, 'id' | 'tenantId' | 'createdAt'>) {
    const feedback = await this.listByTenant(tenantId);
    const next: FeedbackRecord = {
      id: generateId(),
      tenantId,
      createdAt: new Date().toISOString(),
      ...input
    };
    feedback.push(next);
    await this.write(tenantId, feedback);
    return next;
  }

  async listByTenant(tenantId: string) {
    const file = this.pathFor(tenantId);
    try {
      return JSON.parse(await readFile(file, 'utf8')) as FeedbackRecord[];
    } catch {
      return [] as FeedbackRecord[];
    }
  }

  private async write(tenantId: string, content: FeedbackRecord[]) {
    const file = this.pathFor(tenantId);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(content, null, 2), 'utf8');
  }

  private pathFor(tenantId: string) {
    return resolve(ROOT, `${tenantId}.json`);
  }
}
