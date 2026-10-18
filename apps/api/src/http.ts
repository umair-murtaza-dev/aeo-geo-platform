import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorCode } from '@aeo/shared';

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

export function sendData<T>(res: Response, requestId: string, data: T, status = 200): void {
  res.status(status).json({ ok: true, data, requestId });
}

export function sendError(
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  requestId?: string,
  details?: unknown,
): void {
  res.status(status).json({
    ok: false,
    error: {
      code,
      message,
      ...(requestId ? { requestId } : {}),
      ...(details === undefined ? {} : { details }),
    },
  });
}

export function validationDetails(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}
