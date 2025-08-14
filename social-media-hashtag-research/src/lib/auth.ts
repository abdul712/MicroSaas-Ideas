import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { PlanType, UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          planType: user.planType,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // For OAuth providers, ensure user exists in database
        if (account?.provider === 'google' || account?.provider === 'github') {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                role: UserRole.USER,
                planType: PlanType.FREE,
                emailVerified: new Date(),
              },
            });
          }
        }
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.planType = user.planType;
      }

      // Refresh user data from database on each request
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            planType: true,
            planExpiresAt: true,
            searchesUsed: true,
            setsUsed: true,
            competitorsUsed: true,
            lastResetDate: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.planType = dbUser.planType;
          token.planExpiresAt = dbUser.planExpiresAt;
          token.usage = {
            searchesUsed: dbUser.searchesUsed,
            setsUsed: dbUser.setsUsed,
            competitorsUsed: dbUser.competitorsUsed,
            lastResetDate: dbUser.lastResetDate,
          };
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.planType = token.planType as PlanType;
        session.user.planExpiresAt = token.planExpiresAt as Date;
        session.user.usage = token.usage as any;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async createUser({ user }) {
      // Track user registration
      console.log('New user registered:', user.email);
      
      // You can add analytics tracking here
      // analytics.track('User Registered', { userId: user.id, email: user.email });
    },
    async signIn({ user, account, isNewUser }) {
      // Track sign-in
      console.log('User signed in:', user.email, 'Provider:', account?.provider);
      
      // Reset usage limits if needed
      if (user.id) {
        await resetUsageLimitsIfNeeded(user.id);
      }
    },
  },
};

async function resetUsageLimitsIfNeeded(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastResetDate: true,
        planType: true,
      },
    });

    if (!user) return;

    const now = new Date();
    const lastReset = user.lastResetDate;
    const daysSinceReset = Math.floor(
      (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Reset monthly limits (30 days)
    if (daysSinceReset >= 30) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          searchesUsed: 0,
          setsUsed: 0,
          competitorsUsed: 0,
          lastResetDate: now,
        },
      });
    }
  } catch (error) {
    console.error('Error resetting usage limits:', error);
  }
}