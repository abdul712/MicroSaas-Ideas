import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { User, Account } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { account: true }
          })

          if (!user || !user.password) {
            return null
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password)

          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            accountId: user.accountId,
            accountSlug: user.account.slug
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
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
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding'
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { account: true }
          })

          if (!existingUser) {
            // Create new account and user for first-time Google sign-in
            const newAccount = await prisma.account.create({
              data: {
                name: user.name || 'My Company',
                slug: `company-${Math.random().toString(36).substring(7)}`,
                plan: 'STARTER'
              }
            })

            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                avatar: user.image,
                role: 'OWNER',
                accountId: newAccount.id,
                emailVerified: new Date()
              }
            })
          }

          return true
        } catch (error) {
          console.error('Sign-in error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { account: true }
        })

        if (dbUser) {
          token.role = dbUser.role
          token.accountId = dbUser.accountId
          token.accountSlug = dbUser.account.slug
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.accountId = token.accountId as string
        session.user.accountSlug = token.accountSlug as string
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        console.log('New user signed up:', user.email)
        // Could send welcome email, track analytics, etc.
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
}

// Helper functions for authentication
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

// Get user session with additional data
export const getServerSession = async (req: any, res: any) => {
  const { getServerSession } = await import('next-auth')
  return await getServerSession(req, res, authOptions)
}

// Middleware helper to check authentication
export const requireAuth = (handler: any) => {
  return async (req: any, res: any) => {
    const session = await getServerSession(req, res)

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    return handler(req, res, session)
  }
}

// Role-based access control
export const requireRole = (roles: string[]) => {
  return (handler: any) => {
    return requireAuth(async (req: any, res: any, session: any) => {
      if (!roles.includes(session.user.role)) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      return handler(req, res, session)
    })
  }
}