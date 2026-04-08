import { createHash, randomUUID } from 'node:crypto';

export function generateId() {
  return randomUUID();
}

export function hashString(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

export function fingerprintPayload(payload: unknown) {
  return hashString(JSON.stringify(payload));
}
