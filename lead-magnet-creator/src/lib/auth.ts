import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
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
        try {
          const { email, password } = loginSchema.parse(credentials)

          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              organization: true,
            },
          })

          if (!user) {
            return null
          }

          // For OAuth users without password
          if (!user.password) {
            return null
          }

          const isValidPassword = await bcrypt.compare(password, user.password)
          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            role: user.role,
            organizationId: user.organizationId,
            organization: user.organization,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Handle OAuth sign-ins
        if (account?.provider === 'google' || account?.provider === 'github') {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { organization: true },
          })

          // If user doesn't exist, create new user and organization
          if (!existingUser) {
            const organization = await prisma.organization.create({
              data: {
                name: `${user.name}'s Organization`,
                slug: `${user.email?.split('@')[0]}-${Date.now()}`,
                subscription: 'starter',
                planLimits: {
                  leadMagnets: 5,
                  templates: 10,
                  monthlyGenerations: 50,
                  monthlyLeads: 1000,
                },
                usage: {
                  leadMagnets: 0,
                  templates: 0,
                  monthlyGenerations: 0,
                  monthlyLeads: 0,
                },
              },
            })

            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                avatar: user.image,
                role: 'owner',
                organizationId: organization.id,
                isActive: true,
              },
            })
          }
        }

        return true
      } catch (error) {
        console.error('SignIn error:', error)
        return false
      }
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { organization: true },
        })

        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.organizationId = dbUser.organizationId
          token.organization = dbUser.organization
        }
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        return { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organization = token.organization as any
      }

      return session
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log sign-in event
      if (user.organizationId) {
        await prisma.auditLog.create({
          data: {
            action: 'user.signIn',
            resource: 'user',
            resourceId: user.id,
            changes: {
              provider: account?.provider,
              isNewUser,
            },
            organizationId: user.organizationId as string,
            userId: user.id,
          },
        })
      }
    },
    async signOut({ token }) {
      // Log sign-out event
      if (token?.id && token?.organizationId) {
        await prisma.auditLog.create({
          data: {
            action: 'user.signOut',
            resource: 'user',
            resourceId: token.id as string,
            changes: {},
            organizationId: token.organizationId as string,
            userId: token.id as string,
          },
        })
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

// Helper functions for authorization
export const hasPermission = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    viewer: 0,
    member: 1,
    admin: 2,
    owner: 3,
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  return userLevel >= requiredLevel
}

export const canAccessResource = (
  userRole: string,
  userOrganizationId: string,
  resourceOrganizationId: string,
  requiredRole: string = 'member'
): boolean => {
  // Must be in the same organization
  if (userOrganizationId !== resourceOrganizationId) {
    return false
  }

  // Must have required role
  return hasPermission(userRole, requiredRole)
}