import { auth, signOut } from '@/auth';
import { primaryNavigation } from '@/lib/navigation';
import { Button } from '@aeo/ui';
import Link from 'next/link';

export async function SiteHeader() {
  const session = process.env.AUTH_SECRET ? await auth() : null;
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          AEO Platform
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-3 text-sm">
          {primaryNavigation
            .filter((item) => (session?.user ? item.href !== '/login' : item.href !== '/dashboard'))
            .map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-2 py-1 hover:bg-muted">
                {item.label}
              </Link>
            ))}
          {session?.user ? (
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
