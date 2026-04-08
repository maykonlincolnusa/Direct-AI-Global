import { extension } from '../utils/io';
import type { SupportedFileType } from '../pipeline/types';

const EXTENSION_MAP: Record<string, SupportedFileType> = {
  '.pdf': 'pdf',
  '.txt': 'txt',
  '.docx': 'docx',
  '.csv': 'csv',
  '.json': 'json',
  '.md': 'md',
  '.markdown': 'md'
};

export function detectFileType(filePath: string): SupportedFileType | null {
  const ext = extension(filePath);
  return EXTENSION_MAP[ext] ?? null;
}
