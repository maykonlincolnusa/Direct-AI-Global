import type { FastifyPluginAsync } from 'fastify';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '@direct/config';

export class StorageGateway {
  constructor(
    private readonly provider: string,
    private readonly bucket: string,
    private readonly basePath: string
  ) {}

  async upload(
    tenantId: string,
    objectKey: string,
    content: Buffer,
    contentType: string
  ): Promise<{ provider: string; bucket: string; key: string; contentType: string }> {
    if (this.provider !== 'local') {
      // Cloud providers are integrated by adapter without changing call sites.
      return {
        provider: this.provider,
        bucket: this.bucket,
        key: objectKey,
        contentType
      };
    }

    const target = resolve(this.basePath, tenantId, objectKey);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);

    return {
      provider: this.provider,
      bucket: this.bucket,
      key: objectKey,
      contentType
    };
  }

  buildObjectKey(tenantId: string, fileName: string) {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${tenantId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${sanitizedName}`;
  }
}

export const storagePlugin: FastifyPluginAsync = async (fastify) => {
  const storage = new StorageGateway(
    config.STORAGE_PROVIDER,
    config.STORAGE_BUCKET,
    config.STORAGE_BASE_PATH
  );
  fastify.decorate('storage', storage);

  fastify.post('/v1/core/storage/upload-metadata', async (request, reply) => {
    const body = (request.body as Record<string, unknown> | undefined) ?? {};
    const tenantId = String(body.tenantId ?? request.authContext?.tenantId ?? 'public');
    const fileName = String(body.fileName ?? 'asset.bin');
    const objectKey = storage.buildObjectKey(tenantId, fileName);

    reply.status(200).send({
      provider: config.STORAGE_PROVIDER,
      bucket: config.STORAGE_BUCKET,
      objectKey
    });
  });
};
