import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import bcrypt from 'bcryptjs'
import { TRPCError } from '@trpc/server'

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        companyName: z.string().min(2, 'Company name must be at least 2 characters'),
        industry: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { name, email, password, companyName, industry } = input

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user and company in a transaction
      const result = await ctx.prisma.$transaction(async (prisma) => {
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
          },
        })

        const company = await prisma.company.create({
          data: {
            name: companyName,
            industry,
            ownerId: user.id,
            planType: 'STARTER',
            planStatus: 'TRIAL',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          },
        })

        return { user, company }
      })

      return {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
        company: {
          id: result.company.id,
          name: result.company.name,
        },
      }
    }),

  getSession: protectedProcedure.query(async ({ ctx }) => {
    return ctx.session
  }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            industry: true,
            planType: true,
            planStatus: true,
            trialEndsAt: true,
          },
        },
      },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    return user
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updatedUser = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      })

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      }
    }),
})