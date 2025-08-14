import { NextAuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      organizationId?: string;
      subscription?: {
        tier: string;
        status: string;
        creditsRemaining: number;
      };
    };
  }

  interface User {
    role: UserRole;
    organizationId?: string;
    subscription?: {
      tier: string;
      status: string;
      creditsRemaining: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    organizationId?: string;
    subscription?: {
      tier: string;
      status: string;
      creditsRemaining: number;
    };
  }
}

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'r_liteprofile r_emailaddress'
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Allow sign in
        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // Get user from database with subscription info
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            subscription: true,
            organizations: {
              include: {
                organization: true
              },
              orderBy: {
                joinedAt: 'asc'
              },
              take: 1
            }
          }
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.organizationId = dbUser.organizations[0]?.organization.id;
          
          if (dbUser.subscription) {
            token.subscription = {
              tier: dbUser.subscription.tier,
              status: dbUser.subscription.status,
              creditsRemaining: dbUser.creditBalance
            };
          }
        }
      }

      // Return updated token
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.subscription = token.subscription;
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      // Initialize new user with default settings
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: UserRole.USER,
            creditBalance: 20, // Free tier credits
            preferences: {
              theme: 'light',
              language: 'en',
              timezone: 'UTC',
              emailNotifications: true,
              realTimeNotifications: true
            }
          }
        });

        // Create default brand voice
        await prisma.brandVoice.create({
          data: {
            name: 'Default Voice',
            description: 'Your default brand voice',
            userId: user.id,
            tone: ['professional', 'friendly'],
            personality: ['approachable', 'knowledgeable'],
            vocabulary: [],
            avoidWords: [],
            examples: [
              'Welcome to our community! We\'re excited to have you here.',
              'Thanks for sharing this amazing content with us!',
              'We believe in creating meaningful connections through authentic storytelling.'
            ],
            isDefault: true
          }
        });

        console.log(`New user initialized: ${user.email}`);
      } catch (error) {
        console.error('Error initializing new user:', error);
      }
    },
    async signIn({ user, account, isNewUser }) {
      // Track sign-in for analytics
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'user_signin',
            resource: 'auth',
            metadata: {
              provider: account?.provider,
              isNewUser,
              timestamp: new Date()
            }
          }
        });
      } catch (error) {
        console.error('Error logging sign-in:', error);
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    newUser: '/onboarding'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  debug: process.env.NODE_ENV === 'development'
};

// Helper functions for role-based access control
export const hasRole = (session: Session | null, requiredRole: UserRole): boolean => {
  if (!session?.user) return false;
  
  const roleHierarchy = {
    [UserRole.USER]: 0,
    [UserRole.ADMIN]: 1,
    [UserRole.SUPER_ADMIN]: 2
  };

  const userLevel = roleHierarchy[session.user.role];
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
};

export const requireAuth = (session: Session | null): boolean => {
  return !!session?.user;
};

export const requireRole = (session: Session | null, role: UserRole): boolean => {
  return requireAuth(session) && hasRole(session, role);
};

// Organization access control
export const hasOrganizationAccess = async (
  userId: string, 
  organizationId: string,
  requiredRole?: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
): Promise<boolean> => {
  try {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId
      }
    });

    if (!membership) return false;

    if (!requiredRole) return true;

    const roleHierarchy = {
      'VIEWER': 0,
      'EDITOR': 1,
      'ADMIN': 2,
      'OWNER': 3
    };

    const userLevel = roleHierarchy[membership.role];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  } catch (error) {
    console.error('Error checking organization access:', error);
    return false;
  }
};

// API route protection middleware
export const withAuth = (handler: any, requiredRole?: UserRole) => {
  return async (req: any, res: any) => {
    try {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (requiredRole && !hasRole(session, requiredRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Add user to request
      req.user = session.user;
      
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
};

// Credit management
export const getUserCredits = async (userId: string): Promise<number> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true }
    });
    return user?.creditBalance || 0;
  } catch (error) {
    console.error('Error getting user credits:', error);
    return 0;
  }
};

export const deductCredits = async (userId: string, amount: number): Promise<boolean> => {
  try {
    const result = await prisma.user.updateMany({
      where: {
        id: userId,
        creditBalance: { gte: amount }
      },
      data: {
        creditBalance: { decrement: amount },
        totalCreditsUsed: { increment: amount }
      }
    });

    return result.count > 0;
  } catch (error) {
    console.error('Error deducting credits:', error);
    return false;
  }
};

export const addCredits = async (userId: string, amount: number): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: { increment: amount }
      }
    });
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
};

// Subscription helpers
export const hasActiveSubscription = (session: Session | null): boolean => {
  return session?.user?.subscription?.status === 'ACTIVE';
};

export const getSubscriptionTier = (session: Session | null): string => {
  return session?.user?.subscription?.tier || 'FREE';
};

export const canAccessFeature = (session: Session | null, feature: string): boolean => {
  const tier = getSubscriptionTier(session);
  
  const featureAccess = {
    'basic_generation': ['FREE', 'CREATOR', 'PROFESSIONAL', 'AGENCY'],
    'brand_voices': ['CREATOR', 'PROFESSIONAL', 'AGENCY'],
    'image_analysis': ['CREATOR', 'PROFESSIONAL', 'AGENCY'],
    'team_collaboration': ['PROFESSIONAL', 'AGENCY'],
    'api_access': ['PROFESSIONAL', 'AGENCY'],
    'white_label': ['AGENCY'],
    'custom_training': ['AGENCY']
  };

  return featureAccess[feature]?.includes(tier) || false;
};

// Rate limiting helpers
export const checkRateLimit = async (
  userId: string, 
  action: string, 
  windowMs: number = 60000, // 1 minute default
  maxRequests: number = 10
): Promise<{ allowed: boolean; remaining: number }> => {
  const key = `rate_limit:${userId}:${action}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // In a real implementation, use Redis for rate limiting
    // For now, we'll use database-based tracking
    const recentRequests = await prisma.auditLog.count({
      where: {
        userId,
        action,
        createdAt: {
          gte: new Date(windowStart)
        }
      }
    });

    const allowed = recentRequests < maxRequests;
    const remaining = Math.max(0, maxRequests - recentRequests - 1);

    return { allowed, remaining };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: maxRequests };
  }
};

import { getServerSession } from 'next-auth';