import { RegisterForm } from '@/components/register-form';
import { loginAction } from '@/lib/actions';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@aeo/ui';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="grid gap-3">
            <div className="grid gap-1">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-10 rounded-md border border-border px-3"
              />
            </div>
            <div className="grid gap-1">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-10 rounded-md border border-border px-3"
              />
            </div>
            {params.error ? (
              <p role="alert" className="text-sm text-red-700">
                The email or password was not accepted, or the database is not configured.
              </p>
            ) : null}
            {params.registered ? (
              <p role="status" className="text-sm">
                Account created. You can log in.
              </p>
            ) : null}
            <Button type="submit">Continue</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Passwords are hashed before storage. This screen does not grant a platform role.
          </p>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
