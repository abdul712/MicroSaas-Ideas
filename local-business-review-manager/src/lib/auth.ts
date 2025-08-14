import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/business.manage',
        },
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

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            include: {
              businesses: {
                include: {
                  locations: true
                }
              }
            }
          })

          if (!user || !user.email) {
            throw new Error('Invalid credentials')
          }

          // For OAuth users without password, deny credential login
          if (!credentials.password) {
            throw new Error('Please use your OAuth provider to sign in')
          }

          // Verify password (stored in a separate secure table for security)
          const userAuth = await prisma.$queryRaw`
            SELECT password_hash FROM user_auth WHERE user_id = ${user.id}
          ` as Array<{ password_hash: string }>

          if (!userAuth.length) {
            throw new Error('Invalid credentials')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            userAuth[0].password_hash
          )

          if (!isPasswordValid) {
            throw new Error('Invalid credentials')
          }

          // Log successful login for security audit
          await prisma.auditLog.create({
            data: {
              entityType: 'USER',
              entityId: user.id,
              action: 'LOGIN_SUCCESS',
              changes: {
                method: 'credentials',
                timestamp: new Date().toISOString()
              }
            }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        } catch (error) {
          // Log failed login attempt for security
          if (credentials.email) {
            await prisma.auditLog.create({
              data: {
                entityType: 'USER',
                entityId: credentials.email,
                action: 'LOGIN_FAILED',
                changes: {
                  error: error instanceof Error ? error.message : 'Unknown error',
                  timestamp: new Date().toISOString()
                }
              }
            })
          }
          throw error
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.userId = user.id
      }

      // Store OAuth tokens for platform integrations
      if (account?.provider === 'google' && account.access_token) {
        try {
          await prisma.integrationToken.upsert({
            where: {
              businessId_platform: {
                businessId: token.userId as string,
                platform: 'GOOGLE'
              }
            },
            update: {
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
              syncStatus: 'CONNECTED',
              updatedAt: new Date()
            },
            create: {
              businessId: token.userId as string,
              platform: 'GOOGLE',
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
              syncStatus: 'CONNECTED'
            }
          })
        } catch (error) {
          console.error('Failed to store Google OAuth token:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as UserRole
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful login
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },
  events: {
    async signIn({ user, account, profile }) {
      // Log successful OAuth login
      if (account?.provider !== 'credentials' && user.id) {
        await prisma.auditLog.create({
          data: {
            entityType: 'USER',
            entityId: user.id,
            action: 'OAUTH_LOGIN',
            changes: {
              provider: account?.provider,
              timestamp: new Date().toISOString()
            }
          }
        })
      }
    },
    async signOut({ token }) {
      // Log user logout
      if (token?.userId) {
        await prisma.auditLog.create({
          data: {
            entityType: 'USER',
            entityId: token.userId as string,
            action: 'LOGOUT',
            changes: {
              timestamp: new Date().toISOString()
            }
          }
        })
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
}

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Helper function to verify if user has required permissions
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.STAFF]: 1,
    [UserRole.MANAGER]: 2,
    [UserRole.OWNER]: 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Type extensions for NextAuth
declare module 'next-auth' {
  interface User {
    role: UserRole
  }
  
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      role: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    role: UserRole
  }
}