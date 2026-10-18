import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@aeo/shared';
import { sendError, validationDetails } from '../http';
import { safeLogMessage } from '../logger';
import type { Logger } from 'pino';

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error, req, res, _next) => {
    const requestId = req.requestId;
    if (error instanceof AppError) {
      const details = error.code === 'VALIDATION_ERROR' ? error.details : undefined;
      sendError(res, error.status, error.code, error.message, requestId, details);
      return;
    }
    if (error instanceof ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', requestId, validationDetails(error));
      return;
    }

    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    if (status === 413) {
      sendError(res, 413, 'VALIDATION_ERROR', 'Request body exceeds the 100kb limit', requestId);
      return;
    }

    logger.error({ requestId, err: safeLogMessage(error) }, 'unhandled error');
    sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error', requestId);
  };
}
