import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
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
            where: {
              email: credentials.email
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
            image: user.image,
            role: user.role,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.userId = user.id
      }

      // Handle account linking for OAuth providers
      if (account && account.provider !== 'credentials') {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email! }
          })
          
          if (dbUser) {
            token.role = dbUser.role
            token.userId = dbUser.id
          }
        } catch (error) {
          console.error('JWT callback error:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, check if user exists and update profile
      if (account?.provider !== 'credentials') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create new user for OAuth sign-in
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || '',
                image: user.image,
                emailVerified: new Date(),
              }
            })
          } else if (!existingUser.emailVerified) {
            // Verify email for existing users signing in with OAuth
            await prisma.user.update({
              where: { email: user.email! },
              data: { emailVerified: new Date() }
            })
          }
        } catch (error) {
          console.error('Sign in callback error:', error)
          return false
        }
      }

      return true
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign-in events for security monitoring
      console.log(`User signed in: ${user.email} via ${account?.provider}`)
    },
    async signOut({ session, token }) {
      // Log sign-out events
      console.log(`User signed out: ${session?.user?.email}`)
    }
  },
  debug: process.env.NODE_ENV === 'development',
}

export default authOptions