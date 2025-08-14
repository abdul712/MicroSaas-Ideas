import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { compare } from 'bcryptjs'
import { User } from '@prisma/client'
import jwt from 'jsonwebtoken'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            organization: true
          }
        })

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await compare(credentials.password, user.hashedPassword)

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // Update last active
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActive: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.organizationId = (user as any).organizationId
        
        // Create JWT with additional claims
        const jwtToken = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: (user as any).role,
            organizationId: (user as any).organizationId,
          },
          process.env.NEXTAUTH_SECRET!,
          { expiresIn: '30d' }
        )
        
        token.accessToken = jwtToken
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.name
        token.email = session.email
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          organizationId: token.organizationId as string,
          accessToken: token.accessToken as string,
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign in
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create organization for new user
            const organization = await prisma.organization.create({
              data: {
                name: `${user.name}'s Organization`,
                slug: `org-${Date.now()}`,
                planType: 'free',
              }
            })

            // Create user
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                avatar: user.image,
                organizationId: organization.id,
                role: 'admin',
                emailVerified: new Date(),
              }
            })
          } else {
            // Update last active
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastActive: new Date() }
            })
          }

          return true
        } catch (error) {
          console.error('Error during OAuth sign in:', error)
          return false
        }
      }

      return true
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`
      }
      return baseUrl
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        console.log(`New user signed in: ${user.email}`)
        
        // Create audit log
        const userRecord = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (userRecord) {
          await prisma.auditLog.create({
            data: {
              organizationId: userRecord.organizationId,
              userId: userRecord.id,
              action: 'user_signup',
              resource: 'user',
              resourceId: userRecord.id,
              metadata: {
                provider: account?.provider,
                isNewUser,
              }
            }
          })
        }
      }
    },
    async signOut({ token }) {
      if (token?.id) {
        console.log(`User signed out: ${token.id}`)
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
}

// Utility functions for role checking
export function hasRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = ['viewer', 'member', 'manager', 'admin']
  const userLevel = roleHierarchy.indexOf(userRole)
  const requiredLevel = roleHierarchy.indexOf(requiredRole)
  
  return userLevel >= requiredLevel
}

export function canManageTasks(userRole: string): boolean {
  return hasRole(userRole, 'manager')
}

export function canManageOrganization(userRole: string): boolean {
  return hasRole(userRole, 'admin')
}

// JWT verification utility
export function verifyJwtToken(token: string): any {
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!)
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export function createApiToken(userId: string, organizationId: string): string {
  return jwt.sign(
    {
      userId,
      organizationId,
      type: 'api',
    },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: '365d' } // API tokens last longer
  )
}