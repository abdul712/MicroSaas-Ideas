import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { prisma } from './prisma'

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
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Get user with organization data
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                planLimits: true,
              },
            },
          },
        })

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.role = dbUser.role
          session.user.organizationId = dbUser.organizationId
          session.user.organization = dbUser.organization
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { organization: true },
        })

        if (!existingUser) {
          // Create new organization for new user
          const organization = await prisma.organization.create({
            data: {
              name: `${user.name}'s Organization`,
              slug: `${user.email?.split('@')[0]}-${Date.now()}`,
              plan: 'STARTER',
              planLimits: {
                monthlyGenerations: 10,
                monthlyDownloads: 1000,
                storageLimit: 1073741824, // 1GB
                teamMembers: 1,
                brandKits: 1,
                templates: 5,
              },
            },
          })

          // Create user with organization
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: 'OWNER',
              organizationId: organization.id,
              preferences: {
                theme: 'light',
                notifications: true,
                autoSave: true,
              },
            },
          })
        }

        return true
      } catch (error) {
        console.error('Sign in error:', error)
        return false
      }
    },
  },
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        // Log user registration
        await prisma.auditLog.create({
          data: {
            action: 'USER_REGISTERED',
            resource: 'User',
            resourceId: user.id,
            organizationId: (user as any).organizationId,
          },
        })
      } else {
        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
      }
    },
  },
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      organizationId: string
      organization?: {
        id: string
        name: string
        slug: string
        plan: string
        planLimits: any
      }
    } & DefaultSession['user']
  }

  interface User {
    role?: string
    organizationId?: string
  }
}