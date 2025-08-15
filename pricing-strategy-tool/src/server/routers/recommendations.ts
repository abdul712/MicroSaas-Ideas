import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const recommendationsRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
        status: z.enum(['PENDING', 'APPROVED', 'APPLIED', 'REJECTED', 'EXPIRED']).optional(),
        productId: z.string().optional(),
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
        product: { companyId: company.id },
        ...(input.status && { status: input.status }),
        ...(input.productId && { productId: input.productId }),
      }

      const recommendations = await ctx.prisma.recommendation.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
        orderBy: { createdAt: 'desc' },
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
      })

      let nextCursor: string | undefined = undefined
      if (recommendations.length > input.limit) {
        const nextItem = recommendations.pop()
        nextCursor = nextItem!.id
      }

      return {
        recommendations,
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

      const recommendation = await ctx.prisma.recommendation.findFirst({
        where: {
          id: input.id,
          product: { companyId: company.id },
        },
        include: {
          product: true,
        },
      })

      if (!recommendation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Recommendation not found',
        })
      }

      return recommendation
    }),

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        suggestedPrice: z.number().min(0),
        confidenceScore: z.number().min(0).max(100),
        expectedRevenue: z.number().min(0).optional(),
        expectedProfit: z.number().min(0).optional(),
        reasoning: z.string().optional(),
        algorithm: z.string().optional(),
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

      const product = await ctx.prisma.product.findFirst({
        where: { id: input.productId, companyId: company.id },
      })

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        })
      }

      const recommendation = await ctx.prisma.recommendation.create({
        data: {
          ...input,
          currentPrice: product.currentPrice,
        },
      })

      return recommendation
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['PENDING', 'APPROVED', 'APPLIED', 'REJECTED', 'EXPIRED']),
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

      const recommendation = await ctx.prisma.recommendation.findFirst({
        where: {
          id: input.id,
          product: { companyId: company.id },
        },
        include: { product: true },
      })

      if (!recommendation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Recommendation not found',
        })
      }

      const updateData: any = {
        status: input.status,
      }

      // If applying the recommendation, update the product price and create price history
      if (input.status === 'APPLIED') {
        updateData.appliedAt = new Date()

        // Update product price
        await ctx.prisma.product.update({
          where: { id: recommendation.productId },
          data: { currentPrice: recommendation.suggestedPrice },
        })

        // Create price history entry
        await ctx.prisma.priceHistory.create({
          data: {
            productId: recommendation.productId,
            price: recommendation.suggestedPrice,
            inStock: true,
          },
        })
      }

      const updatedRecommendation = await ctx.prisma.recommendation.update({
        where: { id: input.id },
        data: updateData,
      })

      return updatedRecommendation
    }),

  generateRecommendation: protectedProcedure
    .input(z.object({ productId: z.string() }))
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
        where: { id: input.productId, companyId: company.id },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' },
            take: 30,
          },
        },
      })

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        })
      }

      // Get competitor data for analysis
      const competitorPrices = await ctx.prisma.priceHistory.findMany({
        where: {
          competitor: { companyId: company.id },
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        orderBy: { timestamp: 'desc' },
        distinct: ['competitorId'],
      })

      // Simple pricing algorithm (in a real implementation, this would be more sophisticated)
      const currentPrice = product.currentPrice
      const cost = product.cost || 0
      const targetMargin = product.targetMargin || 30
      const avgCompetitorPrice = competitorPrices.length > 0
        ? competitorPrices.reduce((sum, p) => sum + Number(p.price), 0) / competitorPrices.length
        : currentPrice

      // Calculate suggested price based on cost-plus and competitive positioning
      const costPlusPrice = cost > 0 ? cost / (1 - targetMargin / 100) : currentPrice
      const competitivePrice = avgCompetitorPrice * 0.95 // Position slightly below average

      const suggestedPrice = Math.max(costPlusPrice, competitivePrice)
      const priceChange = ((suggestedPrice - currentPrice) / currentPrice) * 100

      // Calculate confidence score based on data quality and market conditions
      const confidenceScore = Math.min(
        100,
        50 + // Base confidence
        (competitorPrices.length * 5) + // More competitor data = higher confidence
        (product.priceHistory.length * 2) // More historical data = higher confidence
      )

      const reasoning = `Recommended price of ${suggestedPrice.toFixed(2)} based on:
- Cost-plus pricing: $${costPlusPrice.toFixed(2)} (${targetMargin}% margin)
- Competitive positioning: $${competitivePrice.toFixed(2)} (5% below average competitor price)
- Price change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%
- ${competitorPrices.length} competitor prices analyzed`

      const recommendation = await ctx.prisma.recommendation.create({
        data: {
          productId: input.productId,
          suggestedPrice,
          currentPrice,
          confidenceScore,
          reasoning,
          algorithm: 'competitive-cost-plus-v1',
        },
      })

      return recommendation
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

    const [pending, applied, rejected, totalGenerated] = await Promise.all([
      ctx.prisma.recommendation.count({
        where: {
          product: { companyId: company.id },
          status: 'PENDING',
        },
      }),
      ctx.prisma.recommendation.count({
        where: {
          product: { companyId: company.id },
          status: 'APPLIED',
        },
      }),
      ctx.prisma.recommendation.count({
        where: {
          product: { companyId: company.id },
          status: 'REJECTED',
        },
      }),
      ctx.prisma.recommendation.count({
        where: {
          product: { companyId: company.id },
        },
      }),
    ])

    const adoptionRate = totalGenerated > 0 ? (applied / totalGenerated) * 100 : 0

    return {
      pending,
      applied,
      rejected,
      totalGenerated,
      adoptionRate,
    }
  }),
})