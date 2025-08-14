import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import { JWT } from 'next-auth/jwt'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
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

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            tenant: true,
          },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.role = user.role
        token.tenantId = user.tenantId
        token.tenantName = user.tenantName
      }
      return token
    },
    async session({ session, token }: { session: any; token: JWT }) {
      session.user.id = token.sub
      session.user.role = token.role
      session.user.tenantId = token.tenantId
      session.user.tenantName = token.tenantName
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
}

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: string
  tenantId: string
  tenantName: string
}

export interface TenantContext {
  tenantId: string
  userId: string
  role: string
}