import { readFile } from 'node:fs/promises';
import { parse as csvParse } from 'csv-parse/sync';
import type { SupportedFileType } from '../pipeline/types';

export class ContentExtractor {
  async extract(filePath: string, fileType: SupportedFileType) {
    switch (fileType) {
      case 'txt':
      case 'md':
        return this.extractPlainText(filePath);
      case 'json':
        return this.extractJson(filePath);
      case 'csv':
        return this.extractCsv(filePath);
      case 'docx':
        return this.extractDocx(filePath);
      case 'pdf':
        return this.extractPdf(filePath);
      default:
        return '';
    }
  }

  private async extractPlainText(filePath: string) {
    const buffer = await readFile(filePath);
    return buffer.toString('utf8');
  }

  private async extractJson(filePath: string) {
    const raw = await this.extractPlainText(filePath);
    const parsed = JSON.parse(raw) as unknown;
    return JSON.stringify(parsed, null, 2);
  }

  private async extractCsv(filePath: string) {
    const raw = await this.extractPlainText(filePath);
    const records = csvParse(raw, {
      columns: true,
      skip_empty_lines: true
    }) as Record<string, unknown>[];

    if (records.length === 0) return '';

    return records
      .slice(0, 5000)
      .map((row) => Object.entries(row).map(([key, value]) => `${key}: ${String(value)}`).join(' | '))
      .join('\n');
  }

  private async extractDocx(filePath: string) {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ path: filePath });
    return value ?? '';
  }

  private async extractPdf(filePath: string) {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await readFile(filePath);
    const parsed = await pdfParse(data);
    return parsed.text ?? '';
  }
}
