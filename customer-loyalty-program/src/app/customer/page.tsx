"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoyaltyCard } from "@/components/customer/loyalty-card"
import { RewardsGrid } from "@/components/customer/rewards-grid"
import { 
  Crown, 
  Gift, 
  TrendingUp, 
  History, 
  Star,
  Sparkles,
  RefreshCw,
  Plus
} from "lucide-react"
import { formatPoints, formatDateTime, calculatePointsToNextTier } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface Membership {
  id: string
  memberNumber: string
  currentPoints: number
  lifetimePoints: number
  currentTier: string | null
  program: {
    id: string
    name: string
    business: {
      name: string
      primaryColor: string
      secondaryColor: string
      logo?: string
    }
    tiers: Array<{
      id: string
      name: string
      threshold: number
      color: string
    }>
  }
  pointTransactions: Array<{
    id: string
    points: number
    description: string
    createdAt: string
  }>
  rewardRedemptions: Array<{
    id: string
    pointsUsed: number
    reward: {
      name: string
    }
    redeemedAt: string
  }>
}

interface Reward {
  id: string
  name: string
  description: string
  rewardType: string
  pointCost: number
  dollarValue?: number
  discountPercent?: number
  isActive: boolean
  validUntil?: Date
  maxRedemptions?: number
  totalRedeemed: number
  image?: string
}

export default function CustomerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRewardsLoading, setIsRewardsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'history'>('overview')

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/login")
      return
    }
    
    fetchMemberships()
  }, [session, status, router])

  useEffect(() => {
    if (selectedMembership) {
      fetchRewards(selectedMembership.program.id)
    }
  }, [selectedMembership])

  const fetchMemberships = async () => {
    try {
      const response = await fetch('/api/loyalty/membership')
      const data = await response.json()
      
      if (response.ok) {
        setMemberships(data.memberships)
        if (data.memberships.length > 0) {
          setSelectedMembership(data.memberships[0])
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load memberships",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load memberships",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRewards = async (programId: string) => {
    setIsRewardsLoading(true)
    try {
      const response = await fetch(`/api/loyalty/rewards?programId=${programId}`)
      const data = await response.json()
      
      if (response.ok) {
        setRewards(data.rewards)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load rewards",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load rewards",
        variant: "destructive",
      })
    } finally {
      setIsRewardsLoading(false)
    }
  }

  const handleRedeemReward = async (rewardId: string) => {
    if (!selectedMembership) return

    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: selectedMembership.id,
          rewardId,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        // Update selected membership with new points balance
        setSelectedMembership(data.updatedMembership)
        
        // Update memberships list
        setMemberships(prev => 
          prev.map(m => 
            m.id === selectedMembership.id ? data.updatedMembership : m
          )
        )
        
        // Refresh rewards to update availability
        fetchRewards(selectedMembership.program.id)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      throw error
    }
  }

  const getNextTierInfo = (membership: Membership) => {
    const tiers = membership.program.tiers.sort((a, b) => a.threshold - b.threshold)
    const pointsToNext = calculatePointsToNextTier(membership.currentPoints, tiers)
    const nextTier = tiers.find(tier => tier.threshold > membership.currentPoints)
    
    return {
      pointsToNext,
      nextTierName: nextTier?.name
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your loyalty programs...</p>
        </div>
      </div>
    )
  }

  if (memberships.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Loyalty Programs Yet</h2>
            <p className="text-gray-600 mb-6">Join a loyalty program to start earning points and rewards!</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Find Programs
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const nextTierInfo = selectedMembership ? getNextTierInfo(selectedMembership) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Loyalty Programs</h1>
            <p className="text-gray-600">Manage your points, rewards, and memberships</p>
          </div>
          <Button variant="outline" onClick={fetchMemberships}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Program Selector */}
        {memberships.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {memberships.map((membership) => (
              <Button
                key={membership.id}
                variant={selectedMembership?.id === membership.id ? "default" : "outline"}
                onClick={() => setSelectedMembership(membership)}
                className="text-sm"
              >
                {membership.program.business.name}
              </Button>
            ))}
          </div>
        )}

        {selectedMembership && (
          <div className="space-y-8">
            {/* Loyalty Card */}
            <LoyaltyCard
              membership={selectedMembership}
              pointsToNextTier={nextTierInfo?.pointsToNext}
              nextTierName={nextTierInfo?.nextTierName}
            />

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'rewards', label: 'Rewards', icon: Gift },
                { id: 'history', label: 'History', icon: History },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Points Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span>Points Summary</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Current Balance</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {formatPoints(selectedMembership.currentPoints)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Lifetime Earned</p>
                          <p className="text-lg font-semibold">
                            {formatPoints(selectedMembership.lifetimePoints)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Current Tier */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-600" />
                        <span>Tier Status</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Current Tier</p>
                          <Badge variant="gold" className="text-sm">
                            {selectedMembership.currentTier || 'Bronze'}
                          </Badge>
                        </div>
                        {nextTierInfo?.nextTierName && (
                          <div>
                            <p className="text-sm text-gray-600">Next Tier</p>
                            <p className="font-medium">{nextTierInfo.nextTierName}</p>
                            <p className="text-xs text-gray-500">
                              {nextTierInfo.pointsToNext} points to go
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <History className="w-5 h-5 text-blue-600" />
                        <span>Recent Activity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedMembership.pointTransactions.slice(0, 3).map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">{transaction.description}</p>
                              <p className="text-xs text-gray-500">
                                {formatDateTime(transaction.createdAt)}
                              </p>
                            </div>
                            <span className={`font-bold text-sm ${
                              transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.points > 0 ? '+' : ''}{transaction.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'rewards' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Rewards</h2>
                    <p className="text-gray-600">
                      You have {formatPoints(selectedMembership.currentPoints)} points to spend
                    </p>
                  </div>
                  
                  {isRewardsLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                      <p className="text-gray-600">Loading rewards...</p>
                    </div>
                  ) : (
                    <RewardsGrid
                      rewards={rewards}
                      currentPoints={selectedMembership.currentPoints}
                      onRedeemReward={handleRedeemReward}
                    />
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  {/* Points History */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Points History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedMembership.pointTransactions.map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-500">
                                {formatDateTime(transaction.createdAt)}
                              </p>
                            </div>
                            <span className={`font-bold ${
                              transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.points > 0 ? '+' : ''}{formatPoints(transaction.points)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Redemption History */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Redemption History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedMembership.rewardRedemptions.map((redemption) => (
                          <div key={redemption.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="font-medium">{redemption.reward.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatDateTime(redemption.redeemedAt)}
                              </p>
                            </div>
                            <span className="font-bold text-red-600">
                              -{formatPoints(redemption.pointsUsed)}
                            </span>
                          </div>
                        ))}
                        {selectedMembership.rewardRedemptions.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No redemptions yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}