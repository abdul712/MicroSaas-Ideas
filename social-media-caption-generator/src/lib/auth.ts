import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import LinkedInProvider from 'next-auth/providers/linkedin';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'r_liteprofile r_emailaddress',
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
          include: {
            subscription: true,
            analytics: true,
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        // For demo purposes, we'll check a simple password
        // In production, you'd have a proper password hash
        const isValid = await bcrypt.compare(credentials.password, user.password || '');
        
        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.role = user.role;
        token.userId = user.id;
        
        // Get or create user subscription on first login
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { subscription: true },
        });

        if (existingUser && !existingUser.subscription) {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              plan: 'FREE',
              credits: 20,
              maxCredits: 20,
              creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          });
        }

        // Create user analytics if not exists
        if (existingUser && !existingUser.analytics) {
          await prisma.userAnalytics.create({
            data: {
              userId: user.id,
              lastActiveAt: new Date(),
            },
          });
        }

        // Log login activity
        await prisma.activity.create({
          data: {
            userId: user.id,
            type: 'USER_LOGIN',
            description: 'User logged in',
            metadata: {
              provider: account?.provider,
              userAgent: token.userAgent,
            },
          },
        });
      }

      // Update last active time
      if (token.userId) {
        await prisma.userAnalytics.updateMany({
          where: { userId: token.userId as string },
          data: { lastActiveAt: new Date() },
        });
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as UserRole;

        // Get fresh subscription data
        const user = await prisma.user.findUnique({
          where: { id: token.userId as string },
          include: {
            subscription: true,
            organizationMemberships: {
              include: {
                organization: {
                  include: {
                    subscription: true,
                  },
                },
              },
            },
          },
        });

        if (user?.subscription) {
          session.user.subscription = user.subscription;
        }

        if (user?.organizationMemberships) {
          session.user.organizations = user.organizationMemberships.map(
            (membership) => ({
              id: membership.organization.id,
              name: membership.organization.name,
              role: membership.role,
              subscription: membership.organization.subscription,
            })
          );
        }
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // Allow OAuth sign-ins
        if (account?.provider !== 'credentials') {
          return true;
        }

        // For credentials, check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        return !!existingUser;
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        // Send welcome email
        console.log(`New user signed up: ${user.email}`);
        
        // Create default brand voice for new users
        await prisma.brandVoice.create({
          data: {
            name: 'Default Voice',
            description: 'Your default brand voice - customize this to match your style',
            type: 'CASUAL',
            userId: user.id,
            examples: [
              'Share your thoughts and connect with your audience!',
              'Thanks for following along on this journey 🙏',
              'Excited to share this with you all!',
            ],
            keywords: ['authentic', 'engaging', 'friendly'],
            isDefault: true,
          },
        });
      }
    },
    async createUser({ user }) {
      console.log(`User created: ${user.email}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};