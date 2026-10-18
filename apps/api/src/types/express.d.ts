import type { AccessTokenPrincipal } from '@aeo/shared';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      principal?: AccessTokenPrincipal;
    }
  }
}

export {};
