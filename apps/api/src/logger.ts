import { sanitizeErrorMessage } from '@aeo/shared';
import pino from 'pino';

export function createLogger(level = process.env.LOG_LEVEL ?? 'info') {
  return pino({
    level,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'passwordHash',
        'accessToken',
        'DATABASE_URL',
        'DIRECT_URL',
        'AUTH_SECRET',
      ],
      censor: '[redacted]',
    },
    formatters: {
      level: (label) => ({ level: label }),
    },
  });
}

export function safeLogMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'unknown error';
  return sanitizeErrorMessage(message);
}
