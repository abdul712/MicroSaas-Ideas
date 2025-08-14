import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase(),
          },
          include: {
            organization: true,
          },
        });

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization,
          permissions: user.permissions,
          department: user.department,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.permissions = user.permissions;
        token.department = user.department;
        token.organization = user.organization;
      }

      // Handle OAuth sign-in
      if (account?.provider === 'google' && user?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { organization: true },
        });

        if (existingUser) {
          token.role = existingUser.role;
          token.organizationId = existingUser.organizationId;
          token.permissions = existingUser.permissions;
          token.department = existingUser.department;
          token.organization = existingUser.organization;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.organizationId = token.organizationId as string;
        session.user.permissions = token.permissions as string[];
        session.user.department = token.department as string;
        session.user.organization = token.organization as any;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Handle Google OAuth sign-in
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Redirect to organization setup for new users
          return `/auth/setup?email=${encodeURIComponent(user.email!)}`;
        }

        if (!existingUser.isActive) {
          return false;
        }

        // Update last login for OAuth users
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { lastLoginAt: new Date() },
        });
      }

      return true;
    },
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log successful sign-in
      if (user.organizationId) {
        await prisma.auditLog.create({
          data: {
            action: 'USER_SIGN_IN',
            entity: 'user',
            entityId: user.id,
            organizationId: user.organizationId,
            userId: user.id,
            changes: {
              provider: account?.provider,
              isNewUser,
            },
          },
        });
      }
    },
    async signOut({ session }) {
      // Log sign-out
      if (session?.user?.organizationId) {
        await prisma.auditLog.create({
          data: {
            action: 'USER_SIGN_OUT',
            entity: 'user',
            entityId: session.user.id,
            organizationId: session.user.organizationId,
            userId: session.user.id,
            changes: {},
          },
        });
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// Helper functions for role-based access control
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('system_admin');
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole) || userRole === 'SUPER_ADMIN';
}

export function canAccessOrganization(
  userOrgId: string,
  targetOrgId: string,
  userRole: UserRole
): boolean {
  // Super admins can access any organization
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }
  
  // Users can only access their own organization
  return userOrgId === targetOrgId;
}

// Permission constants
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Compliance management
  MANAGE_CHECKLISTS: 'manage_checklists',
  VIEW_CHECKLISTS: 'view_checklists',
  COMPLETE_TASKS: 'complete_tasks',
  
  // Regulation management
  MANAGE_REGULATIONS: 'manage_regulations',
  VIEW_REGULATIONS: 'view_regulations',
  
  // Document management
  MANAGE_DOCUMENTS: 'manage_documents',
  VIEW_DOCUMENTS: 'view_documents',
  UPLOAD_DOCUMENTS: 'upload_documents',
  
  // Risk management
  MANAGE_RISKS: 'manage_risks',
  VIEW_RISKS: 'view_risks',
  
  // Audit management
  MANAGE_AUDITS: 'manage_audits',
  VIEW_AUDITS: 'view_audits',
  
  // Reporting
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // System administration
  SYSTEM_ADMIN: 'system_admin',
  ORGANIZATION_ADMIN: 'organization_admin',
} as const;

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [PERMISSIONS.SYSTEM_ADMIN],
  ORG_ADMIN: [
    PERMISSIONS.ORGANIZATION_ADMIN,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_CHECKLISTS,
    PERMISSIONS.MANAGE_REGULATIONS,
    PERMISSIONS.MANAGE_DOCUMENTS,
    PERMISSIONS.MANAGE_RISKS,
    PERMISSIONS.MANAGE_AUDITS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
  ],
  COMPLIANCE_MANAGER: [
    PERMISSIONS.MANAGE_CHECKLISTS,
    PERMISSIONS.VIEW_REGULATIONS,
    PERMISSIONS.MANAGE_DOCUMENTS,
    PERMISSIONS.MANAGE_RISKS,
    PERMISSIONS.MANAGE_AUDITS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.COMPLETE_TASKS,
  ],
  AUDITOR: [
    PERMISSIONS.VIEW_CHECKLISTS,
    PERMISSIONS.VIEW_REGULATIONS,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.VIEW_RISKS,
    PERMISSIONS.MANAGE_AUDITS,
    PERMISSIONS.VIEW_REPORTS,
  ],
  USER: [
    PERMISSIONS.VIEW_CHECKLISTS,
    PERMISSIONS.COMPLETE_TASKS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.VIEW_DOCUMENTS,
  ],
};