import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { PIPELINE_PATHS } from '../pipeline/config';

type LogLevel = 'INFO' | 'ERROR' | 'UNSUPPORTED';

const LOG_FILES: Record<LogLevel, string[]> = {
  INFO: [
    resolve(PIPELINE_PATHS.logs, 'ingestion.log'),
    resolve(PIPELINE_PATHS.kbLogs, 'ingestion.log')
  ],
  ERROR: [
    resolve(PIPELINE_PATHS.logs, 'errors.log'),
    resolve(PIPELINE_PATHS.kbLogs, 'errors.log')
  ],
  UNSUPPORTED: [
    resolve(PIPELINE_PATHS.logs, 'unsupported.log'),
    resolve(PIPELINE_PATHS.kbLogs, 'unsupported.log')
  ]
};

export class PipelineLogger {
  async info(message: string) {
    await this.write('INFO', message);
  }

  async error(message: string) {
    await this.write('ERROR', message);
  }

  async unsupported(message: string) {
    await this.write('UNSUPPORTED', message);
  }

  private async write(level: LogLevel, message: string) {
    const line = `[${new Date().toISOString()}] [${level}] ${message}\n`;
    const targets = LOG_FILES[level];
    await Promise.all(
      targets.map(async (target) => {
        await mkdir(dirname(target), { recursive: true });
        await appendFile(target, line, 'utf8');
      })
    );
  }
}
