import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as PrismaClient),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { organization: true }
        })

        if (!existingUser) {
          // Create new organization for new user
          const organization = await prisma.organization.create({
            data: {
              name: `${user.name}'s Workspace`,
              slug: generateSlug(user.name || user.email!),
              planType: 'STARTER',
              seatsLimit: 1,
            }
          })

          // Create user with organization
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || '',
              avatar: user.image,
              role: 'ADMIN',
              organizationId: organization.id,
              emailVerified: new Date(),
            }
          })

          // Create default calendar
          await prisma.calendar.create({
            data: {
              name: 'Main Calendar',
              description: 'Your primary content calendar',
              color: '#3B82F6',
              isDefault: true,
              organizationId: organization.id,
            }
          })
        }

        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    },
    async session({ session, user }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { 
            organization: true,
            team: true
          }
        })

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.role = dbUser.role
          session.user.organizationId = dbUser.organizationId
          session.user.organization = dbUser.organization
          session.user.teamId = dbUser.teamId
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "database",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8)
}