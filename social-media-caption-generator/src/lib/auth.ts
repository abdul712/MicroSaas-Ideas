import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import LinkedInProvider from 'next-auth/providers/linkedin'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow OAuth sign-ins
      if (account?.provider === 'google' || account?.provider === 'github' || account?.provider === 'linkedin') {
        return true
      }
      return false
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // Store additional user info in token
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            organizationMembers: {
              include: {
                organization: true,
              },
            },
          },
        })

        if (dbUser) {
          token.userId = dbUser.id
          token.subscriptionTier = dbUser.subscriptionTier
          token.creditsRemaining = dbUser.creditsRemaining
          token.organizations = dbUser.organizationMembers.map(member => ({
            id: member.organization.id,
            name: member.organization.name,
            slug: member.organization.slug,
            role: member.role,
          }))
        }

        // Update last login
        await prisma.user.update({
          where: { id: dbUser?.id },
          data: { lastLoginAt: new Date() },
        })
      }

      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.userId as string
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.creditsRemaining = token.creditsRemaining as number
        session.user.organizations = token.organizations as any[]
      }

      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Create default organization for new users
      if (user.email) {
        const organization = await prisma.organization.create({
          data: {
            name: `${user.name || 'User'}'s Workspace`,
            slug: `${user.email.split('@')[0]}-${Date.now()}`,
            plan: 'starter',
            billingEmail: user.email,
          },
        })

        // Add user as owner of the organization
        await prisma.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId: user.id,
            role: 'owner',
          },
        })

        // Create default brand voice
        await prisma.brandVoice.create({
          data: {
            organizationId: organization.id,
            name: 'Default Voice',
            description: 'Your default brand voice',
            tone: 'professional',
            personality: {
              traits: ['friendly', 'helpful', 'professional'],
              style: 'conversational',
              formality: 'moderate',
            },
            sampleContent: [
              'We are excited to share this with you!',
              'Join us on this incredible journey.',
              'Thank you for being part of our community.',
            ],
            isDefault: true,
            isActive: true,
          },
        })
      }
    },
    async signIn({ user, account, isNewUser }) {
      // Track sign-in events
      if (user.email) {
        console.log(`User signed in: ${user.email} via ${account?.provider}`)
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

// Helper function to get current user with organizations
export async function getCurrentUser(userId: string) {
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationMembers: {
        include: {
          organization: {
            include: {
              brandVoices: {
                where: { isActive: true },
                orderBy: { updatedAt: 'desc' },
              },
              platformSettings: true,
            },
          },
        },
      },
    },
  })

  return user
}

// Helper function to check if user has access to organization
export async function hasOrganizationAccess(userId: string, organizationId: string, requiredRole?: string) {
  const member = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
    include: {
      organization: true,
    },
  })

  if (!member) return false

  // Check role hierarchy
  if (requiredRole) {
    const roleHierarchy = ['viewer', 'member', 'admin', 'owner']
    const userRoleIndex = roleHierarchy.indexOf(member.role)
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole)

    return userRoleIndex >= requiredRoleIndex
  }

  return true
}

// Helper function to get organization by ID with access check
export async function getOrganizationWithAccess(userId: string, organizationId: string) {
  const hasAccess = await hasOrganizationAccess(userId, organizationId)
  if (!hasAccess) return null

  return await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      brandVoices: {
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      },
      platformSettings: true,
      projects: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
      },
    },
  })
}

// Helper function to update user credits
export async function updateUserCredits(userId: string, creditsUsed: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsRemaining: true, subscriptionTier: true },
  })

  if (!user) throw new Error('User not found')

  if (user.creditsRemaining < creditsUsed) {
    throw new Error('Insufficient credits')
  }

  return await prisma.user.update({
    where: { id: userId },
    data: {
      creditsRemaining: {
        decrement: creditsUsed,
      },
    },
  })
}

// Helper function to check rate limits
export async function checkRateLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  })

  if (!user) return false

  // Get rate limits based on subscription tier
  const rateLimits = {
    free: 20,
    creator: 100,
    professional: 500,
    agency: 2000,
  }

  const userLimit = rateLimits[user.subscriptionTier as keyof typeof rateLimits] || 20

  // Check API usage in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentUsage = await prisma.apiUsage.count({
    where: {
      userId,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  })

  return recentUsage < userLimit
}