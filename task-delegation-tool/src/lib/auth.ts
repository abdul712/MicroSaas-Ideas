import NextAuth, { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
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
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  planType: true,
                },
              },
            },
          })

          if (!user) {
            throw new Error('Invalid credentials')
          }

          // For OAuth users, password might be null
          if (!user.password) {
            throw new Error('Please sign in with your OAuth provider')
          }

          const isValidPassword = await bcrypt.compare(password, user.password)
          if (!isValidPassword) {
            throw new Error('Invalid credentials')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            image: user.avatar,
            organizationId: user.organizationId,
            organization: user.organization,
            role: user.role,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // Save the organization info in the token
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                planType: true,
                aiFeatures: true,
              },
            },
          },
        })

        if (dbUser) {
          token.organizationId = dbUser.organizationId
          token.organization = dbUser.organization
          token.role = dbUser.role
          token.isActive = dbUser.isActive
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.organizationId = token.organizationId as string
        session.user.organization = token.organization as any
        session.user.role = token.role as string
        session.user.isActive = token.isActive as boolean
      }
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' || account?.provider === 'github') {
          // Handle OAuth sign-in
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { organization: true },
          })

          if (!existingUser) {
            // Create new user and organization for OAuth sign-up
            const organizationName = user.name ? `${user.name}'s Organization` : 'My Organization'
            const organizationSlug = organizationName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')

            await prisma.organization.create({
              data: {
                name: organizationName,
                slug: organizationSlug,
                users: {
                  create: {
                    email: user.email!,
                    fullName: user.name,
                    avatar: user.image,
                    role: 'ADMIN',
                  },
                },
              },
            })
          }
        }
        return true
      } catch (error) {
        console.error('Sign-in error:', error)
        return false
      }
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)