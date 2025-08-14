import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/business.manage",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      // Store OAuth tokens for platform integrations
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.provider = token.provider as string;
      }

      return session;
    },
    async signIn({ user, account, profile }) {
      // Allow OAuth sign-ins
      if (account?.provider === "google") {
        // Ensure user exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Create new user from OAuth
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || "",
              role: UserRole.OWNER,
              avatar: user.image,
            },
          });
        }

        return true;
      }

      // Allow credentials sign-in
      if (account?.provider === "credentials") {
        return true;
      }

      return false;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign-in events
      console.log("User signed in:", {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "SIGN_IN",
          resource: "USER",
          resourceId: user.id,
          newData: {
            provider: account?.provider,
            isNewUser,
          },
        },
      });
    },
    async signOut({ session }) {
      if (session?.user?.id) {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "SIGN_OUT",
            resource: "USER",
            resourceId: session.user.id,
          },
        });
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};

// Utility functions for role-based access control
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.STAFF]: 1,
    [UserRole.MANAGER]: 2,
    [UserRole.OWNER]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const isOwner = (userRole: UserRole): boolean => {
  return userRole === UserRole.OWNER;
};

export const canManageReviews = (userRole: UserRole): boolean => {
  return hasRole(userRole, UserRole.MANAGER);
};

export const canManageBusiness = (userRole: UserRole): boolean => {
  return hasRole(userRole, UserRole.MANAGER);
};

export const canManageUsers = (userRole: UserRole): boolean => {
  return userRole === UserRole.OWNER;
};