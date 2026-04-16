import pino from 'pino';
import { config } from './env';

export const logger = pino({
  level: config.logLevel,
  transport: config.logPretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export function createLogger(component: string) {
  return logger.child({ component });
}
