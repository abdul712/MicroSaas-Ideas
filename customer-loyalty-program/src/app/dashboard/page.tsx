'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Star, Gift, Activity, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PointsDisplay } from '@/components/loyalty/points-display'
import { TierProgress } from '@/components/loyalty/tier-progress'
import { RewardCatalog } from '@/components/loyalty/reward-catalog'
import { useToast } from '@/hooks/use-toast'

// Mock data - in production this would come from your API
const mockMembershipData = {
  totalPoints: 1250,
  availablePoints: 890,
  currentTier: {
    name: 'Gold',
    color: '#FFD700',
    minPoints: 1000
  },
  nextTier: {
    name: 'Platinum',
    color: '#E5E4E2',
    minPoints: 2500
  },
  recentActivities: [
    {
      id: '1',
      type: 'POINTS_EARNED',
      description: 'Earned 50 points from purchase',
      points: 50,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      type: 'TIER_UPGRADED',
      description: 'Upgraded to Gold tier!',
      points: 0,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]
}

const mockRewards = [
  {
    id: '1',
    name: '$10 Off Next Purchase',
    description: 'Get $10 off your next order of $50 or more',
    pointsCost: 500,
    value: 10,
    category: 'Discounts',
    type: 'DISCOUNT_FIXED'
  },
  {
    id: '2',
    name: 'Free Shipping',
    description: 'Free standard shipping on any order',
    pointsCost: 200,
    value: 8.99,
    category: 'Shipping',
    type: 'FREE_SHIPPING'
  },
  {
    id: '3',
    name: 'Premium Gift Box',
    description: 'Exclusive premium gift box with branded items',
    pointsCost: 1000,
    value: 25,
    category: 'Gifts',
    type: 'PHYSICAL_ITEM'
  },
  {
    id: '4',
    name: '20% Off Everything',
    description: 'Take 20% off your entire order',
    pointsCost: 800,
    value: null,
    category: 'Discounts',
    type: 'DISCOUNT_PERCENTAGE'
  }
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [membershipData, setMembershipData] = useState(mockMembershipData)
  const [isPointsAnimating, setIsPointsAnimating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      // In production, redirect to login
      console.log('User not authenticated')
    }
  }, [status])

  const handleRewardRedemption = (rewardId: string) => {
    const reward = mockRewards.find(r => r.id === rewardId)
    if (!reward) return

    if (membershipData.availablePoints >= reward.pointsCost) {
      // Simulate redemption
      setMembershipData(prev => ({
        ...prev,
        availablePoints: prev.availablePoints - reward.pointsCost
      }))

      setIsPointsAnimating(true)
      setTimeout(() => setIsPointsAnimating(false), 600)

      toast({
        title: "Reward Redeemed!",
        description: `Successfully redeemed ${reward.name} for ${reward.pointsCost} points.`,
      })
    } else {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.pointsCost - membershipData.availablePoints} more points to redeem this reward.`,
        variant: "destructive"
      })
    }
  }

  const pointsToNext = membershipData.nextTier 
    ? membershipData.nextTier.minPoints - membershipData.totalPoints 
    : 0

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Your Loyalty Dashboard</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Welcome back, {session?.user?.name || 'Valued Customer'}!
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Points & Tier */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PointsDisplay
                totalPoints={membershipData.totalPoints}
                availablePoints={membershipData.availablePoints}
                tier={membershipData.currentTier}
                isAnimating={isPointsAnimating}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <TierProgress
                currentTier={membershipData.currentTier}
                nextTier={membershipData.nextTier}
                currentPoints={membershipData.totalPoints}
                pointsToNext={pointsToNext}
              />
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="font-semibold">+150 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Saved</span>
                    <span className="font-semibold">$127.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="font-semibold">Jan 2024</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Rewards */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <RewardCatalog
                rewards={mockRewards}
                availablePoints={membershipData.availablePoints}
                onRedeem={handleRewardRedemption}
              />
            </motion.div>
          </div>
        </div>

        {/* Recent Activity */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {membershipData.recentActivities.map((activity, index) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {activity.points > 0 && (
                      <div className="text-sm font-semibold text-primary">
                        +{activity.points} pts
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}