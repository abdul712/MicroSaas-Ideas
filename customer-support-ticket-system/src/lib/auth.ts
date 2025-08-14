import { NextAuthOptions, DefaultSession } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      organizationId: string
      organizationSlug: string
    } & DefaultSession['user']
  }

  interface User {
    role: UserRole
    organizationId: string
    organizationSlug: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    organizationId: string
    organizationSlug: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
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
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        organizationSlug: { label: 'Organization', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        // Find user with organization
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            organization: {
              slug: credentials.organizationSlug || 'default'
            },
          },
          include: {
            organization: true,
          },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        if (!user.isActive) {
          throw new Error('Account is disabled')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
          organizationId: user.organizationId,
          organizationSlug: user.organization.slug,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists or create new user
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { organization: true },
          })

          if (existingUser) {
            // Update last login and link account if needed
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLoginAt: new Date() },
            })
            
            user.role = existingUser.role
            user.organizationId = existingUser.organizationId
            user.organizationSlug = existingUser.organization.slug
          } else {
            // Create new organization and user for Google sign-ups
            const orgSlug = user.email!.split('@')[1].replace(/\./g, '-').toLowerCase()
            
            const newOrg = await prisma.organization.create({
              data: {
                name: `${user.name}'s Organization`,
                slug: orgSlug,
                settings: {},
              },
            })

            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                avatar: user.image,
                role: 'ADMIN',
                organizationId: newOrg.id,
                lastLoginAt: new Date(),
              },
            })

            user.role = newUser.role
            user.organizationId = newOrg.id
            user.organizationSlug = newOrg.slug
          }

          return true
        } catch (error) {
          console.error('Sign in error:', error)
          return false
        }
      }

      return true
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.organizationSlug = user.organizationSlug
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.user.name
        token.email = session.user.email
        token.picture = session.user.image
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.organizationId = token.organizationId
        session.user.organizationSlug = token.organizationSlug
      }

      return session
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (!isNewUser) {
        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
      }
    },
  },
}

// Auth utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Role-based access control
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    CUSTOMER: 0,
    AGENT: 1,
    MANAGER: 2,
    ADMIN: 3,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Middleware helper for API routes
export function requireAuth(requiredRole: UserRole = 'AGENT') {
  return async function(session: any) {
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    if (!hasPermission(session.user.role, requiredRole)) {
      throw new Error('Insufficient permissions')
    }

    return session.user
  }
}