import { auth } from '@/auth';
import { issueAccessToken } from '@aeo/shared';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } },
      { status: 401 },
    );
  }
  if (!process.env.AUTH_SECRET) {
    return NextResponse.json(
      { ok: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'AUTH_SECRET is not configured' } },
      { status: 503 },
    );
  }
  const issued = await issueAccessToken(
    { userId: session.user.id, email: session.user.email, name: session.user.name },
    { secret: process.env.AUTH_SECRET },
  );
  return NextResponse.json({
    ok: true,
    data: {
      tokenType: issued.tokenType,
      accessToken: issued.token,
      expiresAt: issued.expiresAt,
    },
  });
}
