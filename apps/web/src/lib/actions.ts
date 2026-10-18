'use server';

import { auth, signIn, signOut } from '@/auth';
import { createPrismaStore, getPrisma } from '@aeo/db';
import { createOrganizationRequestSchema, registerRequestSchema } from '@aeo/shared';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

function storeOrNull() {
  const prisma = getPrisma();
  return prisma ? createPrismaStore(prisma) : null;
}

export async function loginAction(formData: FormData): Promise<void> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=credentials');
    }
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}

export async function registerAction(_prev: { error?: string } | undefined, formData: FormData) {
  const parsed = registerRequestSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name') || undefined,
  });
  if (!parsed.success) {
    return { error: 'Enter a valid email, a name, and a password of at least 12 characters.' };
  }
  const store = storeOrNull();
  if (!store) return { error: 'Database is not configured. Add DATABASE_URL before creating an account.' };
  try {
    await store.createUser(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create the account.';
    return { error: message };
  }
  redirect('/login?registered=1');
}

export async function createOrganizationAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const parsed = createOrganizationRequestSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    kind: formData.get('kind'),
  });
  if (!parsed.success) {
    return { error: 'Name, slug, and organization type are required. Slugs use lowercase letters, numbers, and hyphens.' };
  }
  const store = storeOrNull();
  if (!store) return { error: 'Database is not configured.' };
  try {
    await store.createOrganization({ ...parsed.data, ownerUserId: session.user.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create the organization.';
    return { error: message };
  }
  redirect('/dashboard');
}
