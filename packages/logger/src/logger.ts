import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import pino from 'pino';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const monorepoRoot = join(__dirname, '..', '..', '..');

const enableFileLogs = process.env.ENABLE_FILE_LOGS !== 'false';

const pinoConfig = {
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label: string) => ({ level: label }),
    log: (object: Record<string, unknown>) => {
      const { level, time, ...rest } = object;
      return {
        level,
        msg: rest.msg,
        data: rest.data || rest,
        time: time
          ? new Date(time as string | number | Date).toISOString()
          : new Date().toISOString(),
      };
    },
  },
};

const pinoTransport = enableFileLogs
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        destination: join(monorepoRoot, 'logs', 'app.log'),
        mkdir: true,
        colorize:
          process.env.NODE_ENV === 'development' && process.env.ENABLE_CONSOLE_LOGS !== 'false',
        translateTime: false,
        ignore: 'pid,hostname',
      },
    })
  : undefined;

const pinoLogger = pino(pinoConfig, pinoTransport);

class Logger {
  static async info(msg: string, data?: unknown) {
    pinoLogger.info(data, msg);
  }

  static async debug(msg: string, data?: unknown) {
    pinoLogger.debug(data, msg);
  }

  static async warn(msg: string, data?: unknown) {
    pinoLogger.warn(data, msg);
  }

  static async error(msg: string, data?: unknown) {
    pinoLogger.error(data, msg);
  }

  static async logDatabase(operation: string, table: string, data?: unknown) {
    pinoLogger.info({ operation, table, data }, `Database operation: ${operation} on ${table}`);
  }

  static async logRouteSync(action: string, data?: unknown) {
    pinoLogger.info({ action, data }, `Route sync: ${action}`);
  }
}

export const logger = Logger;
