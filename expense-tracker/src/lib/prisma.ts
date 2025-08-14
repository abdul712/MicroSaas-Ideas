import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to handle Prisma errors
export function handlePrismaError(error: any) {
  if (error.code === 'P2002') {
    return new Error('A record with this information already exists.');
  }
  if (error.code === 'P2025') {
    return new Error('Record not found.');
  }
  if (error.code === 'P2003') {
    return new Error('Invalid reference to related record.');
  }
  return new Error('Database operation failed.');
}

// Multi-tenant helper to ensure proper data isolation
export function withTenant(organizationId: string | null) {
  return organizationId ? { organizationId } : {};
}

// Row-level security helper for user data
export function withUserAccess(userId: string, organizationId?: string | null) {
  const baseWhere = { userId };
  if (organizationId) {
    return { ...baseWhere, organizationId };
  }
  return baseWhere;
}