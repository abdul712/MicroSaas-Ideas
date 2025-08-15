import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const companiesRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const company = await ctx.prisma.company.findFirst({
      where: { ownerId: ctx.session.user.id },
      include: {
        products: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
        },
        competitors: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
        },
        _count: {
          select: {
            products: true,
            competitors: true,
            pricingRules: true,
          },
        },
      },
    })

    if (!company) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company not found',
      })
    }

    return company
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        industry: z.string().optional(),
        website: z.string().url().optional(),
        description: z.string().optional(),
        targetMarket: z.string().optional(),
        businessModel: z.string().optional(),
        companySize: z.string().optional(),
        revenueRange: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const company = await ctx.prisma.company.findFirst({
        where: { ownerId: ctx.session.user.id },
      })

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      const updatedCompany = await ctx.prisma.company.update({
        where: { id: company.id },
        data: input,
      })

      return updatedCompany
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const company = await ctx.prisma.company.findFirst({
      where: { ownerId: ctx.session.user.id },
    })

    if (!company) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company not found',
      })
    }

    const [
      productsCount,
      competitorsCount,
      rulesCount,
      recommendationsCount,
      recentPriceChanges,
    ] = await Promise.all([
      ctx.prisma.product.count({
        where: { companyId: company.id },
      }),
      ctx.prisma.competitor.count({
        where: { companyId: company.id },
      }),
      ctx.prisma.pricingRule.count({
        where: { companyId: company.id, isActive: true },
      }),
      ctx.prisma.recommendation.count({
        where: {
          product: { companyId: company.id },
          status: 'PENDING',
        },
      }),
      ctx.prisma.priceHistory.count({
        where: {
          product: { companyId: company.id },
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ])

    return {
      products: productsCount,
      competitors: competitorsCount,
      activeRules: rulesCount,
      pendingRecommendations: recommendationsCount,
      recentPriceChanges,
    }
  }),

  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    const company = await ctx.prisma.company.findFirst({
      where: { ownerId: ctx.session.user.id },
    })

    if (!company) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company not found',
      })
    }

    const [recentProducts, recentRecommendations, activeRules] =
      await Promise.all([
        ctx.prisma.product.findMany({
          where: { companyId: company.id },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: {
            _count: {
              select: {
                priceHistory: true,
                recommendations: { where: { status: 'PENDING' } },
              },
            },
          },
        }),
        ctx.prisma.recommendation.findMany({
          where: {
            product: { companyId: company.id },
            status: 'PENDING',
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                currentPrice: true,
              },
            },
          },
        }),
        ctx.prisma.pricingRule.findMany({
          where: { companyId: company.id, isActive: true },
          orderBy: { priority: 'desc' },
          take: 5,
        }),
      ])

    return {
      recentProducts,
      recentRecommendations,
      activeRules,
    }
  }),
})