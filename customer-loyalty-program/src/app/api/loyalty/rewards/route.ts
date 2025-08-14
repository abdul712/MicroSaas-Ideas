import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')

    if (!programId) {
      return NextResponse.json({ error: "Program ID is required" }, { status: 400 })
    }

    // Verify user has access to this program
    const membership = await prisma.loyaltyMembership.findFirst({
      where: {
        programId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get rewards for the program
    const rewards = await prisma.reward.findMany({
      where: {
        programId,
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { pointCost: 'asc' }
      ]
    })

    // Filter out expired rewards and add availability status
    const availableRewards = rewards.filter(reward => {
      if (reward.validUntil && new Date(reward.validUntil) < new Date()) {
        return false
      }
      if (reward.validFrom && new Date(reward.validFrom) > new Date()) {
        return false
      }
      if (reward.maxRedemptions && reward.totalRedeemed >= reward.maxRedemptions) {
        return false
      }
      return true
    })

    return NextResponse.json({ rewards: availableRewards })
  } catch (error) {
    console.error("Error fetching rewards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}