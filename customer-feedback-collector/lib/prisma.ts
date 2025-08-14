import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Row Level Security (RLS) helpers for multi-tenancy
export class TenantAwarePrismaClient {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  // Survey operations with tenant isolation
  get survey() {
    return {
      findMany: (args?: any) =>
        prisma.survey.findMany({
          ...args,
          where: {
            ...args?.where,
            organizationId: this.organizationId,
          },
        }),
      findUnique: (args: any) =>
        prisma.survey.findFirst({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
      create: (args: any) =>
        prisma.survey.create({
          ...args,
          data: {
            ...args.data,
            organizationId: this.organizationId,
          },
        }),
      update: (args: any) =>
        prisma.survey.updateMany({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
      delete: (args: any) =>
        prisma.survey.deleteMany({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
    }
  }

  // Response operations with tenant isolation
  get response() {
    return {
      findMany: (args?: any) =>
        prisma.response.findMany({
          ...args,
          where: {
            ...args?.where,
            organizationId: this.organizationId,
          },
        }),
      findUnique: (args: any) =>
        prisma.response.findFirst({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
      create: (args: any) =>
        prisma.response.create({
          ...args,
          data: {
            ...args.data,
            organizationId: this.organizationId,
          },
        }),
      update: (args: any) =>
        prisma.response.updateMany({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
      delete: (args: any) =>
        prisma.response.deleteMany({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
    }
  }

  // Widget operations with tenant isolation
  get widget() {
    return {
      findMany: (args?: any) =>
        prisma.widget.findMany({
          ...args,
          where: {
            ...args?.where,
            organizationId: this.organizationId,
          },
        }),
      findUnique: (args: any) =>
        prisma.widget.findFirst({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
      create: (args: any) =>
        prisma.widget.create({
          ...args,
          data: {
            ...args.data,
            organizationId: this.organizationId,
          },
        }),
      update: (args: any) =>
        prisma.widget.updateMany({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
      delete: (args: any) =>
        prisma.widget.deleteMany({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
    }
  }

  // User operations with tenant isolation
  get user() {
    return {
      findMany: (args?: any) =>
        prisma.user.findMany({
          ...args,
          where: {
            ...args?.where,
            organizationId: this.organizationId,
          },
        }),
      findUnique: (args: any) =>
        prisma.user.findFirst({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
      update: (args: any) =>
        prisma.user.updateMany({
          ...args,
          where: {
            ...args.where,
            organizationId: this.organizationId,
          },
        }),
    }
  }
}

// Helper function to create tenant-aware client
export function createTenantClient(organizationId: string) {
  return new TenantAwarePrismaClient(organizationId)
}