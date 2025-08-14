import { prisma } from "@/lib/prisma"
import { generateMemberNumber, calculateTierFromPoints } from "@/lib/utils"

export interface EarningRule {
  id: string
  name: string
  condition: {
    type: 'purchase_amount' | 'purchase_frequency' | 'specific_product' | 'first_time'
    value?: number
    productId?: string
  }
  pointsAwarded: number
  multiplier?: number
  maxPerDay?: number
  isActive: boolean
}

export interface LoyaltyEngineConfig {
  programId: string
  businessId: string
  pointValue: number
  earningRules: EarningRule[]
  tiers: any[]
}

export class LoyaltyEngine {
  private config: LoyaltyEngineConfig

  constructor(config: LoyaltyEngineConfig) {
    this.config = config
  }

  // Create or get existing loyalty membership
  async createMembership(customerId: string, userId?: string) {
    try {
      // Check if membership already exists
      const existingMembership = await prisma.loyaltyMembership.findUnique({
        where: {
          programId_customerId: {
            programId: this.config.programId,
            customerId: customerId
          }
        },
        include: {
          customer: true,
          program: true
        }
      })

      if (existingMembership) {
        return existingMembership
      }

      // Create new membership
      const memberNumber = generateMemberNumber()
      
      const membership = await prisma.loyaltyMembership.create({
        data: {
          programId: this.config.programId,
          customerId: customerId,
          userId: userId,
          memberNumber: memberNumber,
          currentPoints: 0,
          lifetimePoints: 0,
          currentTier: null,
          isActive: true
        },
        include: {
          customer: true,
          program: true
        }
      })

      // Award welcome points if configured
      const welcomeRule = this.config.earningRules.find(rule => 
        rule.condition.type === 'first_time' && rule.isActive
      )

      if (welcomeRule) {
        await this.awardPoints(
          membership.id,
          customerId,
          welcomeRule.pointsAwarded,
          'Welcome bonus for joining loyalty program',
          userId
        )
      }

      return membership
    } catch (error) {
      console.error('Error creating loyalty membership:', error)
      throw new Error('Failed to create loyalty membership')
    }
  }

  // Award points based on purchase
  async awardPointsForPurchase(
    membershipId: string, 
    customerId: string, 
    purchaseAmount: number,
    orderId?: string,
    userId?: string
  ) {
    try {
      let totalPointsAwarded = 0
      const transactions = []

      // Apply earning rules
      for (const rule of this.config.earningRules) {
        if (!rule.isActive) continue

        let pointsToAward = 0
        let description = ''

        switch (rule.condition.type) {
          case 'purchase_amount':
            if (purchaseAmount >= (rule.condition.value || 0)) {
              pointsToAward = Math.floor(purchaseAmount * rule.pointsAwarded)
              description = `Earned ${rule.pointsAwarded} points per dollar spent`
            }
            break

          case 'purchase_frequency':
            // Check if customer has made required number of purchases
            const purchaseCount = await this.getCustomerPurchaseCount(customerId)
            if (purchaseCount >= (rule.condition.value || 0)) {
              pointsToAward = rule.pointsAwarded
              description = `Frequency bonus: ${rule.name}`
            }
            break

          default:
            // Base points for any purchase
            pointsToAward = rule.pointsAwarded
            description = rule.name
        }

        if (pointsToAward > 0) {
          // Apply multiplier if configured
          if (rule.multiplier && rule.multiplier > 1) {
            pointsToAward = Math.floor(pointsToAward * rule.multiplier)
            description += ` (${rule.multiplier}x multiplier)`
          }

          // Check daily limits
          if (rule.maxPerDay) {
            const todayPoints = await this.getTodayPointsForRule(membershipId, rule.id)
            if (todayPoints + pointsToAward > rule.maxPerDay) {
              pointsToAward = Math.max(0, rule.maxPerDay - todayPoints)
            }
          }

          if (pointsToAward > 0) {
            const transaction = await this.awardPoints(
              membershipId,
              customerId,
              pointsToAward,
              description,
              userId,
              orderId,
              purchaseAmount
            )
            transactions.push(transaction)
            totalPointsAwarded += pointsToAward
          }
        }
      }

      return {
        totalPointsAwarded,
        transactions
      }
    } catch (error) {
      console.error('Error awarding points for purchase:', error)
      throw new Error('Failed to award points for purchase')
    }
  }

  // Award points with transaction record
  async awardPoints(
    membershipId: string,
    customerId: string,
    points: number,
    description: string,
    userId?: string,
    orderId?: string,
    orderAmount?: number
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Create point transaction
        const transaction = await tx.pointTransaction.create({
          data: {
            membershipId,
            customerId,
            userId,
            transactionType: 'EARNED_PURCHASE',
            points,
            description,
            orderId,
            orderAmount
          }
        })

        // Update membership points
        const updatedMembership = await tx.loyaltyMembership.update({
          where: { id: membershipId },
          data: {
            currentPoints: { increment: points },
            lifetimePoints: { increment: points },
            lastActivity: new Date()
          }
        })

        // Check for tier upgrade
        await this.checkTierUpgrade(updatedMembership.id, updatedMembership.currentPoints, tx)

        return transaction
      })
    } catch (error) {
      console.error('Error awarding points:', error)
      throw new Error('Failed to award points')
    }
  }

  // Redeem points for reward
  async redeemReward(
    membershipId: string,
    customerId: string,
    rewardId: string,
    userId?: string
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get membership and reward details
        const membership = await tx.loyaltyMembership.findUnique({
          where: { id: membershipId }
        })

        const reward = await tx.reward.findUnique({
          where: { id: rewardId }
        })

        if (!membership || !reward) {
          throw new Error('Membership or reward not found')
        }

        if (membership.currentPoints < reward.pointCost) {
          throw new Error('Insufficient points for redemption')
        }

        if (!reward.isActive) {
          throw new Error('Reward is not active')
        }

        // Check reward availability
        if (reward.maxRedemptions && reward.totalRedeemed >= reward.maxRedemptions) {
          throw new Error('Reward is no longer available')
        }

        // Create redemption record
        const redemption = await tx.rewardRedemption.create({
          data: {
            membershipId,
            rewardId,
            customerId,
            userId,
            pointsUsed: reward.pointCost,
            dollarValue: reward.dollarValue,
            status: 'PENDING'
          }
        })

        // Deduct points from membership
        await tx.loyaltyMembership.update({
          where: { id: membershipId },
          data: {
            currentPoints: { decrement: reward.pointCost },
            lastActivity: new Date()
          }
        })

        // Create points transaction record
        await tx.pointTransaction.create({
          data: {
            membershipId,
            customerId,
            userId,
            transactionType: 'REDEEMED',
            points: -reward.pointCost,
            description: `Redeemed: ${reward.name}`
          }
        })

        // Update reward redemption count
        await tx.reward.update({
          where: { id: rewardId },
          data: {
            totalRedeemed: { increment: 1 }
          }
        })

        return redemption
      })
    } catch (error) {
      console.error('Error redeeming reward:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to redeem reward')
    }
  }

  // Check and apply tier upgrade
  private async checkTierUpgrade(membershipId: string, currentPoints: number, tx: any) {
    try {
      const currentTier = calculateTierFromPoints(currentPoints, this.config.tiers)
      
      if (currentTier) {
        await tx.loyaltyMembership.update({
          where: { id: membershipId },
          data: { currentTier }
        })
      }
    } catch (error) {
      console.error('Error checking tier upgrade:', error)
    }
  }

  // Get customer purchase count
  private async getCustomerPurchaseCount(customerId: string): Promise<number> {
    try {
      const count = await prisma.pointTransaction.count({
        where: {
          customerId,
          transactionType: 'EARNED_PURCHASE'
        }
      })
      return count
    } catch (error) {
      console.error('Error getting customer purchase count:', error)
      return 0
    }
  }

  // Get today's points for a specific rule
  private async getTodayPointsForRule(membershipId: string, ruleId: string): Promise<number> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const result = await prisma.pointTransaction.aggregate({
        where: {
          membershipId,
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          description: { contains: ruleId }
        },
        _sum: {
          points: true
        }
      })

      return result._sum.points || 0
    } catch (error) {
      console.error('Error getting today points for rule:', error)
      return 0
    }
  }

  // Get membership analytics
  async getMembershipAnalytics(membershipId: string) {
    try {
      const membership = await prisma.loyaltyMembership.findUnique({
        where: { id: membershipId },
        include: {
          customer: true,
          pointTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          rewardRedemptions: {
            include: { reward: true },
            orderBy: { redeemedAt: 'desc' },
            take: 5
          }
        }
      })

      if (!membership) {
        throw new Error('Membership not found')
      }

      // Calculate analytics
      const totalEarned = await prisma.pointTransaction.aggregate({
        where: {
          membershipId,
          points: { gt: 0 }
        },
        _sum: { points: true }
      })

      const totalRedeemed = await prisma.pointTransaction.aggregate({
        where: {
          membershipId,
          points: { lt: 0 }
        },
        _sum: { points: true }
      })

      const pointsToNextTier = this.config.tiers.length > 0 
        ? this.calculatePointsToNextTier(membership.currentPoints)
        : 0

      return {
        membership,
        analytics: {
          totalEarned: totalEarned._sum.points || 0,
          totalRedeemed: Math.abs(totalRedeemed._sum.points || 0),
          currentBalance: membership.currentPoints,
          lifetimePoints: membership.lifetimePoints,
          currentTier: membership.currentTier,
          pointsToNextTier,
          redemptionCount: membership.rewardRedemptions.length
        }
      }
    } catch (error) {
      console.error('Error getting membership analytics:', error)
      throw new Error('Failed to get membership analytics')
    }
  }

  private calculatePointsToNextTier(currentPoints: number): number {
    const sortedTiers = this.config.tiers.sort((a, b) => a.threshold - b.threshold)
    
    for (const tier of sortedTiers) {
      if (currentPoints < tier.threshold) {
        return tier.threshold - currentPoints
      }
    }
    
    return 0 // Already at highest tier
  }
}