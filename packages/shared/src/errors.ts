export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'TENANT_FORBIDDEN',
  'WORKSPACE_FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'NOT_IMPLEMENTED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export class AppError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sanitizeErrorMessage(input: string): string {
  return input
    .replace(/postgres(?:ql)?:\/\/[^\s'")]+/gi, '[redacted-url]')
    .replace(/(secret|password|token)=([^\s&]+)/gi, '$1=[redacted]');
}
