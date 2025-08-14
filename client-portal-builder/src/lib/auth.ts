import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

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

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            account: true
          }
        })

        if (!user || !user.password) {
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
          accountId: user.accountId,
          account: user.account
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.accountId = user.accountId
        token.account = user.account
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.accountId = token.accountId
        session.user.account = token.account
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Handle Google OAuth sign-in
        // Create account and user if they don't exist
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser) {
          // Create new account and user
          const newAccount = await prisma.account.create({
            data: {
              name: profile?.name || user.name || 'New Account',
              slug: generateSlug(profile?.name || user.name || user.email!),
            }
          })

          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              role: 'OWNER',
              accountId: newAccount.id,
            }
          })
        }
      }
      return true
    }
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 50)
}