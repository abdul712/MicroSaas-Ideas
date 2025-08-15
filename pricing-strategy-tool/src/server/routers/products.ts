import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const productsRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
        search: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findFirst({
        where: { ownerId: ctx.session.user.id },
      })

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      const where = {
        companyId: company.id,
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { sku: { contains: input.search, mode: 'insensitive' as const } },
          ],
        }),
        ...(input.category && { category: input.category }),
      }

      const products = await ctx.prisma.product.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              priceHistory: true,
              recommendations: { where: { status: 'PENDING' } },
            },
          },
        },
      })

      let nextCursor: string | undefined = undefined
      if (products.length > input.limit) {
        const nextItem = products.pop()
        nextCursor = nextItem!.id
      }

      return {
        products,
        nextCursor,
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findFirst({
        where: { ownerId: ctx.session.user.id },
      })

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      const product = await ctx.prisma.product.findFirst({
        where: { id: input.id, companyId: company.id },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' },
            take: 30,
          },
          recommendations: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        })
      }

      return product
    }),

  create: protectedProcedure
    .input(
      z.object({
        sku: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        cost: z.number().min(0).optional(),
        currentPrice: z.number().min(0),
        minPrice: z.number().min(0).optional(),
        maxPrice: z.number().min(0).optional(),
        targetMargin: z.number().min(0).max(100).optional(),
        inventoryLevel: z.number().min(0).optional(),
        weight: z.number().min(0).optional(),
        dimensions: z.record(z.any()).optional(),
        tags: z.array(z.string()).optional(),
        marketplaceUrls: z.record(z.string().url()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findFirst({
        where: { ownerId: ctx.session.user.id },
      })

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      // Check if SKU already exists
      const existingProduct = await ctx.prisma.product.findUnique({
        where: {
          companyId_sku: {
            companyId: company.id,
            sku: input.sku,
          },
        },
      })

      if (existingProduct) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Product with this SKU already exists',
        })
      }

      const product = await ctx.prisma.product.create({
        data: {
          ...input,
          companyId: company.id,
        },
      })

      // Create initial price history entry
      await ctx.prisma.priceHistory.create({
        data: {
          productId: product.id,
          price: product.currentPrice,
          inStock: true,
        },
      })

      return product
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        sku: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        cost: z.number().min(0).optional(),
        currentPrice: z.number().min(0).optional(),
        minPrice: z.number().min(0).optional(),
        maxPrice: z.number().min(0).optional(),
        targetMargin: z.number().min(0).max(100).optional(),
        inventoryLevel: z.number().min(0).optional(),
        weight: z.number().min(0).optional(),
        dimensions: z.record(z.any()).optional(),
        tags: z.array(z.string()).optional(),
        marketplaceUrls: z.record(z.string().url()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const company = await ctx.prisma.company.findFirst({
        where: { ownerId: ctx.session.user.id },
      })

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      const existingProduct = await ctx.prisma.product.findFirst({
        where: { id, companyId: company.id },
      })

      if (!existingProduct) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        })
      }

      // If price changed, create a price history entry
      const shouldCreatePriceHistory =
        updateData.currentPrice && updateData.currentPrice !== existingProduct.currentPrice

      const product = await ctx.prisma.product.update({
        where: { id },
        data: updateData,
      })

      if (shouldCreatePriceHistory) {
        await ctx.prisma.priceHistory.create({
          data: {
            productId: product.id,
            price: product.currentPrice,
            inStock: true,
          },
        })
      }

      return product
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findFirst({
        where: { ownerId: ctx.session.user.id },
      })

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      const product = await ctx.prisma.product.findFirst({
        where: { id: input.id, companyId: company.id },
      })

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        })
      }

      await ctx.prisma.product.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const company = await ctx.prisma.company.findFirst({
      where: { ownerId: ctx.session.user.id },
    })

    if (!company) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company not found',
      })
    }

    const categories = await ctx.prisma.product.findMany({
      where: { companyId: company.id, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    })

    return categories
      .map((p) => p.category)
      .filter(Boolean)
      .sort()
  }),

  getPriceHistory: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findFirst({
        where: { ownerId: ctx.session.user.id },
      })

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      const product = await ctx.prisma.product.findFirst({
        where: { id: input.productId, companyId: company.id },
      })

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        })
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - input.days)

      const priceHistory = await ctx.prisma.priceHistory.findMany({
        where: {
          productId: input.productId,
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: 'asc' },
      })

      return priceHistory
    }),
})