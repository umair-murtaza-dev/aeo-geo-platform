import { AppError, verifyAccessToken } from '@aeo/shared';
import type { RequestHandler } from 'express';

export function requirePrincipal(authSecret: string | undefined): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!authSecret) {
        throw new AppError(503, 'SERVICE_UNAVAILABLE', 'AUTH_SECRET is not configured');
      }
      const header = req.header('authorization') ?? '';
      const match = /^Bearer\s+(\S+)$/i.exec(header);
      if (!match?.[1]) {
        throw new AppError(401, 'UNAUTHENTICATED', 'Bearer token required');
      }
      req.principal = await verifyAccessToken(match[1], { secret: authSecret });
      next();
    } catch (error) {
      next(error);
    }
  };
}
