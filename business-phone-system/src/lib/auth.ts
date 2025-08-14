import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organization: true,
            extension: true,
            teamMemberships: {
              include: {
                team: true
              }
            }
          }
        });

        if (!user) {
          throw new Error('User not found');
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Account is not active');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        // Return user data for session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization,
          extension: user.extension,
          teams: user.teamMemberships.map(tm => tm.team)
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.extension = user.extension;
        token.teams = user.teams;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.extension = token.extension as any;
        session.user.teams = token.teams as any;
        
        // Generate access token for WebRTC
        session.accessToken = jwt.sign(
          { 
            userId: token.sub,
            organizationId: token.organizationId,
            role: token.role 
          },
          process.env.NEXTAUTH_SECRET!,
          { expiresIn: '24h' }
        );
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  organizationId?: string;
  role?: string;
}) {
  const hashedPassword = await hashPassword(data.password);
  
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      role: (data.role as any) || 'USER'
    },
    include: {
      organization: true,
      extension: true
    }
  });
}

export async function createOrganization(data: {
  name: string;
  domain?: string;
  phone?: string;
  address?: string;
  adminEmail: string;
  adminPassword: string;
  adminName?: string;
}) {
  return prisma.$transaction(async (tx) => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: data.name,
        domain: data.domain,
        phone: data.phone,
        address: data.address
      }
    });

    // Create admin user
    const hashedPassword = await hashPassword(data.adminPassword);
    const adminUser = await tx.user.create({
      data: {
        email: data.adminEmail,
        password: hashedPassword,
        name: data.adminName || 'Admin',
        role: 'ADMIN',
        organizationId: organization.id
      }
    });

    // Create main extension for admin
    await tx.extension.create({
      data: {
        number: '100',
        name: 'Main Extension',
        type: 'USER',
        organizationId: organization.id,
        userId: adminUser.id
      }
    });

    return { organization, adminUser };
  });
}

export async function getUserWithPermissions(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: true,
      extension: true,
      teamMemberships: {
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                      status: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
}