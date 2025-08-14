import { prisma } from './prisma'

export interface EarningRule {
  id: string
  type: 'PURCHASE' | 'SIGNUP' | 'REVIEW' | 'REFERRAL' | 'SOCIAL_SHARE' | 'LOGIN_STREAK' | 'MILESTONE' | 'BIRTHDAY' | 'CUSTOM'
  pointsAwarded: number
  multiplier: number
  triggerCondition: any
  isActive: boolean
}

export interface Tier {
  id: string
  name: string
  minPoints: number
  color: string
  benefits: any[]
  multiplier: number
}

export interface Reward {
  id: string
  name: string
  pointsCost: number
  type: 'DISCOUNT_PERCENTAGE' | 'DISCOUNT_FIXED' | 'FREE_PRODUCT' | 'FREE_SHIPPING' | 'GIFT_CARD' | 'EXPERIENCE' | 'PHYSICAL_ITEM' | 'DIGITAL_ITEM'
  value?: number
  isActive: boolean
  stock?: number
}

export class LoyaltyEngine {
  private programId: string

  constructor(programId: string) {
    this.programId = programId
  }

  // Points Management
  async awardPoints(
    userId: string, 
    points: number, 
    type: string = 'EARNED',
    description?: string,
    referenceId?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Get membership
      const membership = await tx.loyaltyMembership.findFirst({
        where: {
          userId,
          loyaltyProgramId: this.programId,
          isActive: true
        },
        include: {
          tier: true
        }
      })

      if (!membership) {
        throw new Error('User is not a member of this loyalty program')
      }

      // Apply tier multiplier
      const finalPoints = Math.floor(points * (membership.tier?.multiplier || 1))

      // Update membership points
      await tx.loyaltyMembership.update({
        where: { id: membership.id },
        data: {
          totalPoints: { increment: finalPoints },
          availablePoints: { increment: finalPoints },
          totalEarned: { increment: finalPoints },
          lastActivityAt: new Date()
        }
      })

      // Create transaction record
      await tx.pointTransaction.create({
        data: {
          userId,
          membershipId: membership.id,
          loyaltyProgramId: this.programId,
          type: type as any,
          points: finalPoints,
          description,
          referenceId,
          metadata: {}
        }
      })

      // Create activity record
      await tx.customerActivity.create({
        data: {
          userId,
          membershipId: membership.id,
          type: 'POINTS_EARNED',
          description: description || `Earned ${finalPoints} points`,
          points: finalPoints,
          metadata: { originalPoints: points, multiplier: membership.tier?.multiplier || 1 }
        }
      })

      // Check for tier upgrade
      await this.checkTierUpgrade(userId, membership.totalPoints + finalPoints, tx)
    })
  }

  async redeemPoints(
    userId: string,
    rewardId: string
  ): Promise<{ success: boolean; redemptionId?: string; error?: string }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get membership
        const membership = await tx.loyaltyMembership.findFirst({
          where: {
            userId,
            loyaltyProgramId: this.programId,
            isActive: true
          }
        })

        if (!membership) {
          throw new Error('User is not a member of this loyalty program')
        }

        // Get reward
        const reward = await tx.reward.findFirst({
          where: {
            id: rewardId,
            loyaltyProgramId: this.programId,
            isActive: true
          }
        })

        if (!reward) {
          throw new Error('Reward not found or inactive')
        }

        // Check if user has enough points
        if (membership.availablePoints < reward.pointsCost) {
          throw new Error('Insufficient points')
        }

        // Check stock if applicable
        if (reward.stock !== null && reward.stock <= 0) {
          throw new Error('Reward out of stock')
        }

        // Deduct points
        await tx.loyaltyMembership.update({
          where: { id: membership.id },
          data: {
            availablePoints: { decrement: reward.pointsCost },
            totalRedeemed: { increment: reward.pointsCost },
            lastActivityAt: new Date()
          }
        })

        // Create redemption record
        const redemption = await tx.rewardRedemption.create({
          data: {
            userId,
            membershipId: membership.id,
            rewardId,
            loyaltyProgramId: this.programId,
            pointsUsed: reward.pointsCost,
            status: 'PENDING',
            redemptionCode: this.generateRedemptionCode(),
            metadata: {}
          }
        })

        // Create transaction record
        await tx.pointTransaction.create({
          data: {
            userId,
            membershipId: membership.id,
            loyaltyProgramId: this.programId,
            type: 'REDEEMED',
            points: -reward.pointsCost,
            description: `Redeemed ${reward.name}`,
            referenceId: redemption.id,
            metadata: {}
          }
        })

        // Create activity record
        await tx.customerActivity.create({
          data: {
            userId,
            membershipId: membership.id,
            type: 'POINTS_REDEEMED',
            description: `Redeemed ${reward.name} for ${reward.pointsCost} points`,
            points: -reward.pointsCost,
            metadata: { rewardId, redemptionId: redemption.id }
          }
        })

        // Update stock if applicable
        if (reward.stock !== null) {
          await tx.reward.update({
            where: { id: rewardId },
            data: { stock: { decrement: 1 } }
          })
        }

        return { success: true, redemptionId: redemption.id }
      })

      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Tier Management
  private async checkTierUpgrade(userId: string, totalPoints: number, tx: any): Promise<void> {
    // Get all tiers for this program
    const tiers = await tx.tier.findMany({
      where: { loyaltyProgramId: this.programId },
      orderBy: { minPoints: 'desc' }
    })

    // Find the highest tier the user qualifies for
    const qualifyingTier = tiers.find(tier => totalPoints >= tier.minPoints)
    
    if (!qualifyingTier) return

    // Get current membership
    const membership = await tx.loyaltyMembership.findFirst({
      where: {
        userId,
        loyaltyProgramId: this.programId,
        isActive: true
      },
      include: { tier: true }
    })

    // Check if this is an upgrade
    if (!membership.tier || qualifyingTier.minPoints > membership.tier.minPoints) {
      // Update membership tier
      await tx.loyaltyMembership.update({
        where: { id: membership.id },
        data: { tierId: qualifyingTier.id }
      })

      // Create activity record
      await tx.customerActivity.create({
        data: {
          userId,
          membershipId: membership.id,
          type: 'TIER_UPGRADED',
          description: `Upgraded to ${qualifyingTier.name} tier!`,
          metadata: { 
            oldTier: membership.tier?.name || 'None', 
            newTier: qualifyingTier.name 
          }
        }
      })
    }
  }

  // Earning Rules Engine
  async processEarningEvent(
    userId: string,
    eventType: string,
    eventData: any
  ): Promise<number> {
    const rules = await prisma.earningRule.findMany({
      where: {
        loyaltyProgramId: this.programId,
        type: eventType as any,
        isActive: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: new Date() } }
        ],
        AND: [
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: new Date() } }
            ]
          }
        ]
      }
    })

    let totalPointsEarned = 0

    for (const rule of rules) {
      if (this.evaluateRuleCondition(rule.triggerCondition, eventData)) {
        const points = Math.floor(rule.pointsAwarded * rule.multiplier)
        await this.awardPoints(
          userId,
          points,
          'EARNED',
          `Earned points from ${eventType}`,
          `rule_${rule.id}`
        )
        totalPointsEarned += points
      }
    }

    return totalPointsEarned
  }

  private evaluateRuleCondition(condition: any, eventData: any): boolean {
    // Simple condition evaluation - in production, this would be more sophisticated
    if (!condition || Object.keys(condition).length === 0) {
      return true
    }

    // Example conditions:
    // { minAmount: 50 } - purchase amount must be >= 50
    // { productCategory: "electronics" } - product category must match
    
    for (const [key, value] of Object.entries(condition)) {
      switch (key) {
        case 'minAmount':
          if (!eventData.amount || eventData.amount < value) return false
          break
        case 'productCategory':
          if (!eventData.category || eventData.category !== value) return false
          break
        case 'minItems':
          if (!eventData.items || eventData.items < value) return false
          break
        default:
          if (eventData[key] !== value) return false
      }
    }

    return true
  }

  // Utility Methods
  private generateRedemptionCode(): string {
    return 'RDM-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  async getMembershipStats(userId: string) {
    const membership = await prisma.loyaltyMembership.findFirst({
      where: {
        userId,
        loyaltyProgramId: this.programId,
        isActive: true
      },
      include: {
        tier: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!membership) {
      throw new Error('Membership not found')
    }

    // Get next tier
    const nextTier = await prisma.tier.findFirst({
      where: {
        loyaltyProgramId: this.programId,
        minPoints: { gt: membership.totalPoints }
      },
      orderBy: { minPoints: 'asc' }
    })

    return {
      membership,
      nextTier,
      pointsToNextTier: nextTier ? nextTier.minPoints - membership.totalPoints : 0
    }
  }

  async getAvailableRewards(userId: string) {
    const membership = await prisma.loyaltyMembership.findFirst({
      where: {
        userId,
        loyaltyProgramId: this.programId,
        isActive: true
      }
    })

    if (!membership) {
      throw new Error('Membership not found')
    }

    const rewards = await prisma.reward.findMany({
      where: {
        loyaltyProgramId: this.programId,
        isActive: true,
        OR: [
          { stock: null },
          { stock: { gt: 0 } }
        ],
        AND: [
          {
            OR: [
              { validFrom: null },
              { validFrom: { lte: new Date() } }
            ]
          },
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: new Date() } }
            ]
          }
        ]
      },
      orderBy: { pointsCost: 'asc' }
    })

    return rewards.map(reward => ({
      ...reward,
      canRedeem: membership.availablePoints >= reward.pointsCost
    }))
  }
}