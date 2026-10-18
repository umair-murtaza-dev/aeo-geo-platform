import { auth } from '@/auth';
import { OrganizationForm } from '@/components/organization-form';
import { createPrismaStore, getPrisma } from '@aeo/db';
import { Card, CardContent, CardHeader, CardTitle } from '@aeo/ui';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  if (!process.env.AUTH_SECRET) {
    return (
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p>AUTH_SECRET is not configured, so a session cannot be verified.</p>
      </section>
    );
  }
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const prisma = getPrisma();
  const store = prisma ? createPrismaStore(prisma) : null;
  const memberships = store ? await store.listMemberships(session.user.id) : [];

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Signed in as {session.user.email}. This page lists organizations your account belongs to.
        </p>
      </div>
      {!store ? (
        <p role="status">Database is not configured. Organization data cannot be loaded.</p>
      ) : memberships.length === 0 ? (
        <p>No organizations yet.</p>
      ) : (
        <ul className="grid gap-3">
          {memberships.map((membership) => (
            <li key={membership.organizationId}>
              <Card>
                <CardHeader>
                  <CardTitle>{membership.organizationName}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {membership.organizationSlug} · {membership.role}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Create an organization</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationForm />
        </CardContent>
      </Card>
    </section>
  );
}
