import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: Role
      organizationId: string
      organization: {
        id: string
        name: string
        plan: string
      }
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: Role
    organizationId: string
    organization: {
      id: string
      name: string
      plan: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    organizationId: string
    organization: {
      id: string
      name: string
      plan: string
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
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
          where: { email: credentials.email },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                plan: true
              }
            }
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        // Handle OAuth sign-in
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { organization: true }
        })

        if (!existingUser) {
          // Create new user and organization for OAuth users
          const organization = await prisma.organization.create({
            data: {
              name: `${user.name}'s Organization`,
              plan: 'STARTER'
            }
          })

          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              role: 'OWNER',
              organizationId: organization.id
            }
          })
        }
      }
      return true
    },
    
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // First time signing in
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
        token.organization = user.organization
      }

      if (trigger === 'update' && session) {
        // Update token from session update
        return { ...token, ...session }
      }

      // Refresh user data on each request
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                plan: true
              }
            }
          }
        })

        if (dbUser) {
          token.role = dbUser.role
          token.organizationId = dbUser.organizationId
          token.organization = dbUser.organization
        }
      }

      return token
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.organizationId = token.organizationId
        session.user.organization = token.organization
      }
      return session
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log successful sign-in
      await prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: 'USER_SIGNIN',
          resource: 'USER',
          resourceId: user.id,
          metadata: {
            provider: account?.provider,
            isNewUser
          }
        }
      })
    },
    async signOut({ token }) {
      if (token?.id) {
        // Log sign-out
        await prisma.auditLog.create({
          data: {
            organizationId: token.organizationId,
            userId: token.id,
            action: 'USER_SIGNOUT',
            resource: 'USER',
            resourceId: token.id
          }
        })
      }
    }
  },
  debug: process.env.NODE_ENV === 'development'
}

// Auth utilities
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export async function createUserWithOrganization(
  email: string,
  password: string,
  name: string,
  organizationName?: string
) {
  const hashedPassword = await hashPassword(password)
  
  // Create organization first
  const organization = await prisma.organization.create({
    data: {
      name: organizationName || `${name}'s Organization`,
      plan: 'STARTER'
    }
  })

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'OWNER',
      organizationId: organization.id
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          plan: true
        }
      }
    }
  })

  return user
}

// Role-based access control
export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy = {
    'VIEWER': 0,
    'EDITOR': 1,
    'ADMIN': 2,
    'OWNER': 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function canAccessResource(
  userRole: Role,
  userOrgId: string,
  resourceOrgId: string,
  requiredRole: Role = 'VIEWER'
): boolean {
  return userOrgId === resourceOrgId && hasPermission(userRole, requiredRole)
}

// Middleware helpers
export async function getCurrentUser(request: Request) {
  // This would be used in API routes and middleware
  // Implementation depends on how you handle JWT in requests
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return null
  }

  try {
    // Verify JWT token and return user
    // Implementation depends on your JWT strategy
    return null
  } catch (error) {
    return null
  }
}

// Organization management
export async function inviteUserToOrganization(
  organizationId: string,
  email: string,
  role: Role,
  invitedBy: string
) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    // Update user's organization if they're not already a member
    if (existingUser.organizationId !== organizationId) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          organizationId,
          role
        }
      })
    }
  } else {
    // Create invitation record (you might want a separate Invitation model)
    // For now, we'll create the user with a temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    await createUserWithOrganization(email, tempPassword, email.split('@')[0])
  }

  // Log the invitation
  await prisma.auditLog.create({
    data: {
      organizationId,
      userId: invitedBy,
      action: 'USER_INVITED',
      resource: 'USER',
      metadata: {
        invitedEmail: email,
        role
      }
    }
  })
}

export async function removeUserFromOrganization(
  organizationId: string,
  userId: string,
  removedBy: string
) {
  await prisma.user.delete({
    where: {
      id: userId,
      organizationId
    }
  })

  // Log the removal
  await prisma.auditLog.create({
    data: {
      organizationId,
      userId: removedBy,
      action: 'USER_REMOVED',
      resource: 'USER',
      resourceId: userId
    }
  })
}