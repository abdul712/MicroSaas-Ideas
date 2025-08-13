import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to handle Prisma errors
export function handlePrismaError(error: any) {
  if (error.code === 'P2002') {
    return { error: 'A record with this information already exists.' };
  }
  if (error.code === 'P2025') {
    return { error: 'Record not found.' };
  }
  if (error.code === 'P2003') {
    return { error: 'Foreign key constraint failed.' };
  }
  if (error.code === 'P2014') {
    return { error: 'Invalid ID provided.' };
  }
  
  console.error('Prisma error:', error);
  return { error: 'An unexpected error occurred.' };
}

// Multi-tenancy helper to ensure queries are scoped to tenant
export function withTenant(tenantId: string) {
  return {
    where: {
      tenantId,
    },
  };
}

// Pagination helper
export function withPagination(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
}

// Common query options for list endpoints
export function createListQuery(
  tenantId: string,
  {
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filters = {},
  }: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
  } = {}
) {
  return {
    where: {
      tenantId,
      ...filters,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    ...withPagination(page, limit),
  };
}

export default prisma;