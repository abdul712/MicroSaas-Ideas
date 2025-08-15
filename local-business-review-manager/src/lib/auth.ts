import { NextAuthOptions, Session, User } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/prisma'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      tenantId?: string | null
    }
  }

  interface User {
    id: string
    role: string
    tenantId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    tenantId?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
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
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'email,pages_read_engagement,pages_manage_posts',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'you@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase(),
          },
          include: {
            tenant: true,
          },
        })

        if (!user) {
          throw new Error('No user found with this email')
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated')
        }

        // For OAuth users, password might be null
        if (!user.password) {
          throw new Error('Please sign in with your OAuth provider')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tenantId: user.tenantId,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/welcome',
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          if (existingUser) {
            // Update last login
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLoginAt: new Date() },
            })

            // Create audit log
            await createAuditLog({
              userId: existingUser.id,
              action: 'LOGIN',
              resource: 'User',
              resourceId: existingUser.id,
              metadata: {
                provider: account.provider,
                ip: '', // Will be filled by middleware
              },
            })
          }

          return true
        } catch (error) {
          console.error('Sign in error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
      }

      // Refresh user data from database
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            id: true,
            role: true,
            tenantId: true,
            isActive: true,
          },
        })

        if (!dbUser || !dbUser.isActive) {
          // Force sign out inactive users
          return {}
        }

        token.role = dbUser.role
        token.tenantId = dbUser.tenantId
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.tenantId = token.tenantId
      }

      return session
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        await createAuditLog({
          userId: user.id,
          action: 'CREATE',
          resource: 'User',
          resourceId: user.id,
          metadata: {
            provider: account?.provider,
            isNewUser: true,
          },
        })
      }
    },
    async signOut({ session, token }) {
      if (token?.id) {
        await createAuditLog({
          userId: token.id,
          action: 'LOGOUT',
          resource: 'User',
          resourceId: token.id,
        })
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// User creation utility
export async function createUser({
  email,
  password,
  name,
  role = 'VIEWER',
  tenantId,
}: {
  email: string
  password?: string
  name?: string
  role?: string
  tenantId?: string
}) {
  const hashedPassword = password ? await hashPassword(password) : null

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: role as any,
      tenantId,
    },
  })

  await createAuditLog({
    userId: user.id,
    action: 'CREATE',
    resource: 'User',
    resourceId: user.id,
    newValues: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })

  return user
}

// Role checking utilities
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  const roleHierarchy = {
    SUPER_ADMIN: 6,
    TENANT_OWNER: 5,
    TENANT_ADMIN: 4,
    MANAGER: 3,
    STAFF: 2,
    VIEWER: 1,
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = Math.min(...requiredRoles.map(role => 
    roleHierarchy[role as keyof typeof roleHierarchy] || 0
  ))

  return userLevel >= requiredLevel
}

export function canAccessBusiness(userRole: string, businessRole?: string): boolean {
  if (!businessRole) return false
  
  const roleHierarchy = {
    TENANT_OWNER: 5,
    TENANT_ADMIN: 4,
    MANAGER: 3,
    STAFF: 2,
    VIEWER: 1,
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const businessLevel = roleHierarchy[businessRole as keyof typeof roleHierarchy] || 0

  return userLevel >= businessLevel
}

// Permission checking utilities
export const PERMISSIONS = {
  // Business permissions
  CREATE_BUSINESS: ['SUPER_ADMIN', 'TENANT_OWNER'],
  UPDATE_BUSINESS: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'],
  DELETE_BUSINESS: ['SUPER_ADMIN', 'TENANT_OWNER'],
  VIEW_BUSINESS: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'STAFF', 'VIEWER'],

  // Review permissions
  VIEW_REVIEWS: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'STAFF', 'VIEWER'],
  RESPOND_REVIEWS: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'STAFF'],
  DELETE_REVIEW_RESPONSE: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER'],
  MODERATE_REVIEWS: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER'],

  // Campaign permissions
  CREATE_CAMPAIGN: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER'],
  UPDATE_CAMPAIGN: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER'],
  DELETE_CAMPAIGN: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'],
  VIEW_CAMPAIGNS: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'STAFF'],

  // Analytics permissions
  VIEW_ANALYTICS: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER'],
  EXPORT_DATA: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'],

  // User management permissions
  INVITE_USERS: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'],
  MANAGE_USERS: ['SUPER_ADMIN', 'TENANT_OWNER'],
  UPDATE_USER_ROLES: ['SUPER_ADMIN', 'TENANT_OWNER'],

  // Integration permissions
  MANAGE_INTEGRATIONS: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'],
  VIEW_API_KEYS: ['SUPER_ADMIN', 'TENANT_OWNER'],

  // Billing permissions
  MANAGE_BILLING: ['SUPER_ADMIN', 'TENANT_OWNER'],
  VIEW_BILLING: ['SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN'],
} as const

export function hasPermission(userRole: string, permission: keyof typeof PERMISSIONS): boolean {
  const requiredRoles = PERMISSIONS[permission]
  return hasRole(userRole, requiredRoles)
}

// Session utilities
export async function getServerSession() {
  // This would be implemented with next-auth's getServerSession
  // For now, returning a mock structure
  return null
}

export async function requireAuth() {
  const session = await getServerSession()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

export async function requireRole(requiredRoles: string[]) {
  const session = await requireAuth()
  if (!hasRole(session.user.role, requiredRoles)) {
    throw new Error('Insufficient permissions')
  }
  return session
}

// Token utilities
export function generateVerificationToken(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export function generateApiKey(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'rm_'
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Account lockout utilities
export async function checkAccountLockout(email: string): Promise<boolean> {
  // In a real implementation, you'd check failed login attempts
  // and return true if account is locked
  return false
}

export async function recordFailedLogin(email: string): Promise<void> {
  // In a real implementation, you'd increment failed login counter
  // and potentially lock account after too many attempts
  await createAuditLog({
    action: 'LOGIN',
    resource: 'User',
    metadata: {
      email,
      success: false,
      reason: 'invalid_credentials',
    },
  })
}

// Two-factor authentication utilities
export function generateTOTPSecret(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return secret
}

export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase()
    codes.push(code)
  }
  return codes
}