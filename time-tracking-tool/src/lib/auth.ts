import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            workspaceMembers: {
              include: {
                workspace: true
              }
            }
          }
        })

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )

        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        if (!user.isActive) {
          throw new Error('Account is disabled. Please contact support.')
        }

        // Update last active timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          timezone: user.timezone,
          emailVerified: user.emailVerified,
          onboardingComplete: user.onboardingComplete,
          workspaces: user.workspaceMembers.map(member => ({
            id: member.workspace.id,
            name: member.workspace.name,
            slug: member.workspace.slug,
            role: member.role
          }))
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    })
  ],
  session: {
    strategy: 'jwt',
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
      if (account?.provider === 'google' || account?.provider === 'github') {
        // Handle OAuth sign in
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (existingUser) {
            // Update last active timestamp
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { 
                lastActiveAt: new Date(),
                avatar: user.image || existingUser.avatar
              }
            })
            return true
          }

          // Create new user for OAuth
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || '',
              avatar: user.image,
              emailVerified: new Date(),
              role: UserRole.USER,
              isActive: true,
              lastActiveAt: new Date()
            }
          })

          return true
        } catch (error) {
          console.error('OAuth sign in error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.timezone = user.timezone
        token.onboardingComplete = user.onboardingComplete
        token.workspaces = user.workspaces
      }

      // Refresh user data periodically
      if (token.email && Date.now() - (token.iat || 0) * 1000 > 24 * 60 * 60 * 1000) {
        try {
          const refreshedUser = await prisma.user.findUnique({
            where: { email: token.email },
            include: {
              workspaceMembers: {
                include: {
                  workspace: true
                }
              }
            }
          })

          if (refreshedUser) {
            token.role = refreshedUser.role
            token.timezone = refreshedUser.timezone
            token.onboardingComplete = refreshedUser.onboardingComplete
            token.workspaces = refreshedUser.workspaceMembers.map(member => ({
              id: member.workspace.id,
              name: member.workspace.name,
              slug: member.workspace.slug,
              role: member.role
            }))
          }
        } catch (error) {
          console.error('Token refresh error:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.timezone = token.timezone as string
        session.user.onboardingComplete = token.onboardingComplete as boolean
        session.user.workspaces = token.workspaces as any[]
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign in
      if (url.startsWith(baseUrl)) {
        const callbackUrl = new URL(url).searchParams.get('callbackUrl')
        if (callbackUrl) {
          return callbackUrl.startsWith(baseUrl) ? callbackUrl : baseUrl + '/dashboard'
        }
        return url
      }
      
      return baseUrl + '/dashboard'
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        // Log new user registration
        console.log(`New user registered: ${user.email}`)
        
        // Send welcome email (implement as needed)
        // await sendWelcomeEmail(user.email, user.name)
      }

      // Create audit log
      if (user.id) {
        await prisma.auditLog.create({
          data: {
            action: 'SIGN_IN',
            entity: 'User',
            entityId: user.id,
            userId: user.id,
            changes: {
              provider: account?.provider,
              timestamp: new Date().toISOString()
            }
          }
        }).catch(console.error)
      }
    },
    async signOut({ session, token }) {
      // Create audit log
      if (token?.sub) {
        await prisma.auditLog.create({
          data: {
            action: 'SIGN_OUT',
            entity: 'User',
            entityId: token.sub,
            userId: token.sub,
            changes: {
              timestamp: new Date().toISOString()
            }
          }
        }).catch(console.error)
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}