import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          username: profile.email.split('@')[0],
          firstName: profile.given_name,
          lastName: profile.family_name,
          avatarUrl: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        }
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          email: profile.email,
          username: profile.login,
          firstName: profile.name?.split(' ')[0] || profile.login,
          lastName: profile.name?.split(' ').slice(1).join(' ') || '',
          avatarUrl: profile.avatar_url,
          emailVerified: new Date(),
        }
      },
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
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error('User not found')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.avatarUrl = user.avatarUrl
      }

      // Update last seen
      if (token.id) {
        await prisma.user.update({
          where: { id: token.id as string },
          data: { lastSeenAt: new Date() }
        })
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.avatarUrl = token.avatarUrl as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create username from email if not provided
            const username = user.username || user.email!.split('@')[0]
            
            // Ensure username is unique
            let uniqueUsername = username
            let counter = 1
            while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
              uniqueUsername = `${username}${counter}`
              counter++
            }

            await prisma.user.create({
              data: {
                email: user.email!,
                username: uniqueUsername,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                avatarUrl: user.avatarUrl,
                emailVerified: new Date(),
                status: 'ONLINE',
              }
            })
          } else {
            // Update existing user's last seen
            await prisma.user.update({
              where: { email: user.email! },
              data: { 
                lastSeenAt: new Date(),
                status: 'ONLINE'
              }
            })
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }
      return true
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}