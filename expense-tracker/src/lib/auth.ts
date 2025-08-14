import { NextAuthOptions, DefaultSession } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { JWT } from 'next-auth/jwt'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

// Extend NextAuth types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
      organizationId: string
      organizationName: string
      subscriptionTier: string
      mfaEnabled: boolean
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    organizationId: string
    organizationName?: string
    subscriptionTier?: string
    mfaEnabled: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    organizationId: string
    organizationName?: string
    subscriptionTier?: string
    mfaEnabled: boolean
  }
}

// Auth configuration
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        mfaToken: { label: 'MFA Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                subscriptionTier: true,
                subscriptionStatus: true,
              },
            },
          },
        })

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid email or password')
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated')
        }

        if (user.organization.subscriptionStatus !== 'ACTIVE') {
          throw new Error('Organization subscription is not active')
        }

        const passwordValid = await compare(credentials.password, user.hashedPassword)
        if (!passwordValid) {
          throw new Error('Invalid email or password')
        }

        // MFA verification if enabled
        if (user.mfaEnabled) {
          if (!credentials.mfaToken) {
            throw new Error('MFA token is required')
          }

          if (!user.mfaSecret) {
            throw new Error('MFA is not properly configured')
          }

          const isValidToken = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: credentials.mfaToken,
            window: 2, // Allow 2 time steps (60 seconds) of tolerance
          })

          if (!isValidToken) {
            throw new Error('Invalid MFA token')
          }
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        // Log successful login
        await prisma.auditLog.create({
          data: {
            action: 'LOGIN',
            resource: 'User',
            resourceId: user.id,
            userId: user.id,
            organizationId: user.organizationId,
            newValues: {
              loginTime: new Date().toISOString(),
              ipAddress: 'unknown', // Will be set by middleware
            },
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          image: user.avatar,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          subscriptionTier: user.organization.subscriptionTier,
          mfaEnabled: user.mfaEnabled,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
        token.organizationName = user.organizationName
        token.subscriptionTier = user.subscriptionTier
        token.mfaEnabled = user.mfaEnabled
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.organizationId = token.organizationId
        session.user.organizationName = token.organizationName || ''
        session.user.subscriptionTier = token.subscriptionTier || 'FREE'
        session.user.mfaEnabled = token.mfaEnabled
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        // Log successful logout
        await prisma.auditLog.create({
          data: {
            action: 'LOGOUT',
            resource: 'User',
            resourceId: token.id,
            userId: token.id,
            organizationId: token.organizationId,
            newValues: {
              logoutTime: new Date().toISOString(),
            },
          },
        }).catch(console.error)
      }
    },
  },
}

// JWT utilities for API endpoints
export function generateJWT(payload: any, expiresIn = '1h') {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn })
}

export function verifyJWT(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch {
    return null
  }
}

// Role-based access control helpers
export enum Permission {
  READ_EXPENSES = 'read:expenses',
  WRITE_EXPENSES = 'write:expenses',
  DELETE_EXPENSES = 'delete:expenses',
  MANAGE_USERS = 'manage:users',
  MANAGE_ORGANIZATION = 'manage:organization',
  EXPORT_DATA = 'export:data',
  VIEW_ANALYTICS = 'view:analytics',
  MANAGE_BUDGETS = 'manage:budgets',
  APPROVE_EXPENSES = 'approve:expenses',
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  USER: [
    Permission.READ_EXPENSES,
    Permission.WRITE_EXPENSES,
    Permission.EXPORT_DATA,
  ],
  ADMIN: [
    Permission.READ_EXPENSES,
    Permission.WRITE_EXPENSES,
    Permission.DELETE_EXPENSES,
    Permission.MANAGE_USERS,
    Permission.EXPORT_DATA,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_BUDGETS,
    Permission.APPROVE_EXPENSES,
  ],
  SUPER_ADMIN: Object.values(Permission),
}

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

export function checkPermission(userRole: string, requiredPermission: Permission) {
  if (!hasPermission(userRole, requiredPermission)) {
    throw new Error(`Insufficient permissions. Required: ${requiredPermission}`)
  }
}

// MFA utilities
export async function generateMFASecret(userEmail: string) {
  const secret = speakeasy.generateSecret({
    name: `ExpenseTracker Pro (${userEmail})`,
    issuer: 'ExpenseTracker Pro',
    length: 32,
  })

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    manualEntryKey: secret.base32,
  }
}

export function verifyMFAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  })
}

export async function enableMFA(userId: string, secret: string, token: string) {
  // Verify the token first
  if (!verifyMFAToken(secret, token)) {
    throw new Error('Invalid MFA token')
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () => 
    Math.random().toString(36).substring(2, 10).toUpperCase()
  )

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: backupCodes,
    },
  })

  return { backupCodes }
}

export async function disableMFA(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hashedPassword: true },
  })

  if (!user?.hashedPassword) {
    throw new Error('User not found')
  }

  const passwordValid = await compare(password, user.hashedPassword)
  if (!passwordValid) {
    throw new Error('Invalid password')
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    },
  })
}

// Password utilities
export function validatePasswordStrength(password: string) {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const isValid = Object.values(requirements).every(req => req)
  
  return {
    isValid,
    requirements,
    score: Object.values(requirements).filter(Boolean).length,
  }
}

// Session utilities
export async function getServerSession(req: any) {
  // This would be used in API routes to get the current session
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null

  const decoded = verifyJWT(token)
  if (!decoded) return null

  return decoded
}

export default authOptions