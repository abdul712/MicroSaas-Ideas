import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import type { NextAuthConfig } from "next-auth"

const config = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
          throw new Error("User not found")
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          throw new Error("Invalid password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: user.plan,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.plan = user.plan
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token.name = session.name
        token.email = session.email
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as any
        session.user.plan = token.plan as any
      }

      return session
    },
    async signIn({ user, account, profile }) {
      // Allow OAuth providers
      if (account?.provider !== "credentials") {
        return true
      }

      // For credentials, user is already validated in authorize
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  events: {
    async createUser({ user }) {
      // Initialize user analytics
      await prisma.userAnalytics.create({
        data: {
          userId: user.id!,
          date: new Date(),
        }
      })
    },
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        // Track new user signup
        console.log(`New user signed up: ${user.email}`)
      }
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)

// Helper function to get current user
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

// Helper function to check if user has required plan
export function hasRequiredPlan(userPlan: string, requiredPlan: string): boolean {
  const planHierarchy = ['FREE', 'STARTER', 'PROFESSIONAL', 'BUSINESS', 'AGENCY']
  const userIndex = planHierarchy.indexOf(userPlan)
  const requiredIndex = planHierarchy.indexOf(requiredPlan)
  
  return userIndex >= requiredIndex
}

// Type augmentation for NextAuth
declare module "next-auth" {
  interface User {
    role?: string
    plan?: string
  }

  interface Session {
    user: User & {
      id: string
      role?: string
      plan?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    plan?: string
  }
}