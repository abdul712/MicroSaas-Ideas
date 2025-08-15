import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const competitorsRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
        search: z.string().optional(),
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
            { website: { contains: input.search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const competitors = await ctx.prisma.competitor.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { priceHistory: true },
          },
        },
      })

      let nextCursor: string | undefined = undefined
      if (competitors.length > input.limit) {
        const nextItem = competitors.pop()
        nextCursor = nextItem!.id
      }

      return {
        competitors,
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

      const competitor = await ctx.prisma.competitor.findFirst({
        where: { id: input.id, companyId: company.id },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' },
            take: 100,
          },
        },
      })

      if (!competitor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Competitor not found',
        })
      }

      return competitor
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        website: z.string().url(),
        description: z.string().optional(),
        marketPosition: z.string().optional(),
        scrapeFrequency: z.number().min(1).max(168).default(24), // 1 hour to 1 week
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

      const competitor = await ctx.prisma.competitor.create({
        data: {
          ...input,
          companyId: company.id,
        },
      })

      return competitor
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        website: z.string().url().optional(),
        description: z.string().optional(),
        marketPosition: z.string().optional(),
        scrapeFrequency: z.number().min(1).max(168).optional(),
        monitoringStatus: z.enum(['ACTIVE', 'PAUSED', 'ERROR', 'RATE_LIMITED']).optional(),
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

      const competitor = await ctx.prisma.competitor.findFirst({
        where: { id, companyId: company.id },
      })

      if (!competitor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Competitor not found',
        })
      }

      const updatedCompetitor = await ctx.prisma.competitor.update({
        where: { id },
        data: updateData,
      })

      return updatedCompetitor
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

      const competitor = await ctx.prisma.competitor.findFirst({
        where: { id: input.id, companyId: company.id },
      })

      if (!competitor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Competitor not found',
        })
      }

      await ctx.prisma.competitor.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  getPriceHistory: protectedProcedure
    .input(
      z.object({
        competitorId: z.string(),
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

      const competitor = await ctx.prisma.competitor.findFirst({
        where: { id: input.competitorId, companyId: company.id },
      })

      if (!competitor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Competitor not found',
        })
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - input.days)

      const priceHistory = await ctx.prisma.priceHistory.findMany({
        where: {
          competitorId: input.competitorId,
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: 'asc' },
      })

      return priceHistory
    }),

  getCompetitorAnalysis: protectedProcedure
    .input(z.object({ productId: z.string() }))
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

      // Get competitor prices for similar products (simplified logic)
      const competitorData = await ctx.prisma.competitor.findMany({
        where: { companyId: company.id, isActive: true },
        include: {
          priceHistory: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      })

      return {
        product,
        competitors: competitorData.map((competitor) => ({
          ...competitor,
          latestPrice: competitor.priceHistory[0]?.price || null,
          lastUpdated: competitor.priceHistory[0]?.timestamp || null,
        })),
      }
    }),
})