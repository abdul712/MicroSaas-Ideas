import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LoyaltyEngine } from "@/lib/loyalty-engine"
import { z } from "zod"

const createMembershipSchema = z.object({
  programId: z.string(),
  customerData: z.object({
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  })
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { programId, customerData } = createMembershipSchema.parse(body)

    // Get the loyalty program with business details
    const program = await prisma.loyaltyProgram.findUnique({
      where: { id: programId },
      include: {
        business: true,
        tiers: { orderBy: { threshold: 'asc' } }
      }
    })

    if (!program) {
      return NextResponse.json({ error: "Loyalty program not found" }, { status: 404 })
    }

    // Create or find customer profile
    let customer = await prisma.customerProfile.findFirst({
      where: {
        businessId: program.businessId,
        OR: [
          { email: customerData.email },
          { phone: customerData.phone }
        ].filter(Boolean)
      }
    })

    if (!customer) {
      customer = await prisma.customerProfile.create({
        data: {
          businessId: program.businessId,
          userId: session.user.id,
          email: customerData.email,
          phone: customerData.phone,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
        }
      })
    }

    // Initialize loyalty engine
    const loyaltyEngine = new LoyaltyEngine({
      programId: program.id,
      businessId: program.businessId,
      pointValue: program.pointValue,
      earningRules: (program.earningRules as any[]) || [],
      tiers: program.tiers
    })

    // Create membership
    const membership = await loyaltyEngine.createMembership(customer.id, session.user.id)

    return NextResponse.json({ 
      success: true, 
      membership: {
        ...membership,
        program: {
          ...program,
          business: program.business
        }
      }
    })
  } catch (error) {
    console.error("Error creating membership:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const programId = searchParams.get('programId')

    let whereClause: any = {
      userId: session.user.id
    }

    if (businessId) {
      whereClause.customer = { businessId }
    }

    if (programId) {
      whereClause.programId = programId
    }

    const memberships = await prisma.loyaltyMembership.findMany({
      where: whereClause,
      include: {
        program: {
          include: {
            business: true,
            tiers: { orderBy: { threshold: 'asc' } }
          }
        },
        customer: true,
        pointTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        rewardRedemptions: {
          include: { reward: true },
          orderBy: { redeemedAt: 'desc' },
          take: 3
        }
      },
      orderBy: { lastActivity: 'desc' }
    })

    return NextResponse.json({ memberships })
  } catch (error) {
    console.error("Error fetching memberships:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}