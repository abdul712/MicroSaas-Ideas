import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        
        // Get user from database to include additional fields
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            subscriptionPlan: true,
            credits: true,
            apiUsage: true,
            apiLimit: true,
            companyName: true,
            industry: true,
          },
        })
        
        if (dbUser) {
          session.user = {
            ...session.user,
            ...dbUser,
          }
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
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
    async createUser({ user }) {
      // Initialize new user with default values
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionPlan: 'free',
          credits: 10,
          apiLimit: 10,
          apiUsage: 0,
        },
      })
    },
  },
}