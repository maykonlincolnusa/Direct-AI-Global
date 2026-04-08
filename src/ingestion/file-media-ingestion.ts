import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';

const SUPPORTED_EXTENSIONS = new Set([
  '.pdf',
  '.csv',
  '.xlsx',
  '.json',
  '.txt',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
]);

export interface IngestedFileContent {
  fileName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  extractedText?: string;
  storagePath: string;
}

export class FileMediaIngestionService {
  async ingest(filePath: string): Promise<IngestedFileContent | null> {
    const extension = extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      return null;
    }

    const [buffer, fileStats] = await Promise.all([readFile(filePath), stat(filePath)]);
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const mimeType = resolveMimeType(extension);
    const extractedText = await this.extractText(buffer, extension);

    return {
      fileName: basename(filePath),
      extension,
      mimeType,
      sizeBytes: fileStats.size,
      checksum,
      extractedText,
      storagePath: filePath
    };
  }

  private async extractText(buffer: Buffer, extension: string) {
    if (extension === '.txt' || extension === '.json' || extension === '.csv') {
      return buffer.toString('utf8').slice(0, 100000);
    }

    if (extension === '.docx') {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value.slice(0, 100000);
      } catch {
        return '';
      }
    }

    if (extension === '.pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const result = await pdfParse(buffer);
        return (result.text ?? '').slice(0, 100000);
      } catch {
        return '';
      }
    }

    if (extension === '.xlsx') {
      try {
        const { Workbook } = await import('exceljs');
        const workbook = new Workbook();
        await workbook.xlsx.load(buffer as any);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) return '';

        const lines: string[] = [];
        worksheet.eachRow((row) => {
          const rawValues = Array.isArray(row.values)
            ? row.values.slice(1)
            : Object.values(row.values).slice(1);
          const values = rawValues
            .map((value) => {
              if (value == null) return '';
              if (typeof value === 'object') {
                try {
                  return JSON.stringify(value);
                } catch {
                  return String(value);
                }
              }
              return String(value ?? '');
            })
            .join(',');
          lines.push(values);
        });

        return lines.join('\n').slice(0, 100000);
      } catch {
        return '';
      }
    }

    return '';
  }
}

function resolveMimeType(extension: string) {
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.csv': 'text/csv',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  return map[extension] ?? 'application/octet-stream';
}
