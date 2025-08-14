import { NextAuthOptions, DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      organizationId?: string;
      image?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId?: string;
    image?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    organizationId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true },
        });

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
          throw new Error('Account is disabled');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          organizationId: user.organizationId || undefined,
          image: user.image || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
      }

      // Update session trigger (for profile updates)
      if (trigger === 'update' && session?.user) {
        token.name = session.user.name;
        token.email = session.user.email;
        token.picture = session.user.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
      }

      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Allow OAuth sign-ins
      if (account?.provider !== 'credentials') {
        return true;
      }

      // For credentials, validation is done in authorize
      return true;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser && account?.provider === 'google') {
        // Create audit log for new OAuth user
        await prisma.auditLog.create({
          data: {
            action: 'SIGNUP_OAUTH',
            entityType: 'User',
            entityId: user.id,
            newValues: {
              provider: account.provider,
              email: user.email,
            },
            userId: user.id,
          },
        });
      }
    },
    async signOut({ session, token }) {
      if (token?.id) {
        // Create audit log for sign out
        await prisma.auditLog.create({
          data: {
            action: 'LOGOUT',
            entityType: 'User',
            entityId: token.id,
            userId: token.id,
          },
        });
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// Helper functions for authentication checks
export async function getCurrentUser(sessionUserId: string) {
  return await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      organization: true,
    },
  });
}

export async function requireAuth(sessionUserId?: string) {
  if (!sessionUserId) {
    throw new Error('Authentication required');
  }

  const user = await getCurrentUser(sessionUserId);
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  return user;
}

export async function requireRole(sessionUserId: string, allowedRoles: UserRole[]) {
  const user = await requireAuth(sessionUserId);
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }

  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}