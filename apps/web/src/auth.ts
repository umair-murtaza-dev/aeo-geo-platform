import { createPrismaStore, getPrisma } from '@aeo/db';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { loginRequestSchema } from '@aeo/shared';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const prisma = getPrisma();
const store = prisma ? createPrismaStore(prisma) : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = loginRequestSchema.safeParse(credentials);
        if (!parsed.success || !store) return null;
        const user = await store.verifyLogin(parsed.data.email, parsed.data.password);
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
