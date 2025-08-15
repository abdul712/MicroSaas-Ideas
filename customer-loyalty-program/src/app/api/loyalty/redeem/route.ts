import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LoyaltyEngine } from "@/lib/loyalty-engine"
import { z } from "zod"

const redeemRewardSchema = z.object({
  membershipId: z.string(),
  rewardId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { membershipId, rewardId } = redeemRewardSchema.parse(body)

    // Verify membership belongs to user
    const membership = await prisma.loyaltyMembership.findFirst({
      where: {
        id: membershipId,
        userId: session.user.id
      },
      include: {
        program: {
          include: {
            business: true,
            tiers: { orderBy: { threshold: 'asc' } }
          }
        },
        customer: true
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 })
    }

    // Get reward details
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    })

    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 })
    }

    // Verify reward belongs to the same program
    if (reward.programId !== membership.programId) {
      return NextResponse.json({ error: "Reward not available for this program" }, { status: 400 })
    }

    // Initialize loyalty engine
    const loyaltyEngine = new LoyaltyEngine({
      programId: membership.program.id,
      businessId: membership.program.businessId,
      pointValue: membership.program.pointValue,
      earningRules: (membership.program.earningRules as any[]) || [],
      tiers: membership.program.tiers
    })

    // Redeem the reward
    const redemption = await loyaltyEngine.redeemReward(
      membershipId,
      membership.customerId,
      rewardId,
      session.user.id
    )

    // Get updated membership data
    const updatedMembership = await prisma.loyaltyMembership.findUnique({
      where: { id: membershipId },
      include: {
        program: {
          include: {
            business: true,
            tiers: { orderBy: { threshold: 'asc' } }
          }
        },
        customer: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      redemption,
      updatedMembership
    })
  } catch (error) {
    console.error("Error redeeming reward:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 })
    }
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}