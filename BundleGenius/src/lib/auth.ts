import { NextAuthOptions, DefaultSession } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { prisma } from "./prisma"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
      storeId?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    storeId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    storeId?: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
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
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        
        // Get user's primary store
        const userStores = await prisma.store.findMany({
          where: { ownerId: user.id },
          orderBy: { createdAt: "asc" },
          take: 1
        })
        
        if (userStores.length > 0) {
          token.storeId = userStores[0].id
        }
      }
      
      // Handle session update
      if (trigger === "update" && session) {
        if (session.storeId) {
          token.storeId = session.storeId
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.storeId = token.storeId
      }

      return session
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Allow OAuth signins
      if (account?.type === "oauth") {
        return true
      }
      
      // Allow email signins
      if (account?.type === "email") {
        return true
      }
      
      return false
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Create audit log for sign in
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "SIGN_IN",
          resource: "USER",
          resourceId: user.id,
          details: {
            provider: account?.provider,
            isNewUser,
          },
        },
      })
    },
    async createUser({ user }) {
      // Create audit log for new user
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_USER",
          resource: "USER", 
          resourceId: user.id,
          details: {
            email: user.email,
          },
        },
      })
    },
  },
}

// Helper functions for role-based access control
export const hasRole = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole)
}

export const canAccessStore = async (userId: string, storeId: string): Promise<boolean> => {
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId: userId
            }
          }
        }
      ]
    }
  })
  
  return !!store
}

export const getUserStoreRole = async (userId: string, storeId: string): Promise<string | null> => {
  // Check if user is owner
  const ownedStore = await prisma.store.findFirst({
    where: {
      id: storeId,
      ownerId: userId
    }
  })
  
  if (ownedStore) {
    return "OWNER"
  }
  
  // Check member role
  const membership = await prisma.storeMember.findFirst({
    where: {
      userId: userId,
      storeId: storeId
    }
  })
  
  return membership?.role || null
}