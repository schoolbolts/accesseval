import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  organizationId: string;
  role: string;
  plan: string;
}

interface JWTWithCustom {
  organizationId?: string;
  role?: string;
  plan?: string;
  sub?: string;
  [key: string]: unknown;
}

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true },
        });
        if (!user) return null;
        const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!passwordValid) return null;
        return {
          id: user.id, email: user.email, name: user.name,
          organizationId: user.organizationId,
          role: user.role, plan: user.organization.plan,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as unknown as AuthUser;
        const t = token as JWTWithCustom;
        t.organizationId = authUser.organizationId;
        t.role = authUser.role;
        t.plan = authUser.plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as JWTWithCustom;
        const u = session.user as unknown as AuthUser;
        u.id = t.sub ?? '';
        u.organizationId = t.organizationId ?? '';
        u.role = t.role ?? '';
        u.plan = t.plan ?? '';
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
};
