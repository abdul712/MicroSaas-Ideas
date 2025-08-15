"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Gift, 
  Star, 
  Clock, 
  CheckCircle, 
  ShoppingBag,
  Percent,
  CreditCard,
  Sparkles
} from "lucide-react"
import { formatPoints, formatCurrency, isRewardAvailable } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

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

interface RewardsGridProps {
  rewards: Reward[]
  currentPoints: number
  onRedeemReward: (rewardId: string) => Promise<void>
  isLoading?: boolean
}

export function RewardsGrid({ rewards, currentPoints, onRedeemReward, isLoading }: RewardsGridProps) {
  const [redeeming, setRedeeming] = useState<string | null>(null)

  const handleRedeem = async (reward: Reward) => {
    if (currentPoints < reward.pointCost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.pointCost - currentPoints} more points to redeem this reward.`,
        variant: "destructive",
      })
      return
    }

    if (!isRewardAvailable(reward)) {
      toast({
        title: "Reward Unavailable",
        description: "This reward is no longer available or has expired.",
        variant: "destructive",
      })
      return
    }

    setRedeeming(reward.id)
    try {
      await onRedeemReward(reward.id)
      toast({
        title: "Reward Redeemed!",
        description: `You have successfully redeemed ${reward.name}.`,
      })
    } catch (error) {
      toast({
        title: "Redemption Failed",
        description: "Could not redeem reward. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRedeeming(null)
    }
  }

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'DISCOUNT':
        return <Percent className="w-5 h-5" />
      case 'FREE_ITEM':
        return <Gift className="w-5 h-5" />
      case 'GIFT_CARD':
        return <CreditCard className="w-5 h-5" />
      case 'CASHBACK':
        return <ShoppingBag className="w-5 h-5" />
      default:
        return <Star className="w-5 h-5" />
    }
  }

  const getRewardValue = (reward: Reward) => {
    if (reward.dollarValue) {
      return formatCurrency(reward.dollarValue)
    }
    if (reward.discountPercent) {
      return `${reward.discountPercent}% OFF`
    }
    return 'Special Offer'
  }

  const canRedeem = (reward: Reward) => {
    return currentPoints >= reward.pointCost && isRewardAvailable(reward)
  }

  if (rewards.length === 0) {
    return (
      <div className="text-center py-12">
        <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Rewards Available</h3>
        <p className="text-gray-500">Check back soon for exciting rewards!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rewards.map((reward, index) => (
        <motion.div
          key={reward.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
            canRedeem(reward) ? 'border-green-200 hover:border-green-300' : 'border-gray-200'
          }`}>
            {/* Availability Indicator */}
            {canRedeem(reward) && (
              <div className="absolute top-2 right-2 z-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Available
                  </Badge>
                </motion.div>
              </div>
            )}

            {/* Reward Image */}
            {reward.image && (
              <div className="h-32 bg-gradient-to-br from-purple-100 to-blue-100 relative overflow-hidden">
                <img
                  src={reward.image}
                  alt={reward.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}

            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${
                    canRedeem(reward) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getRewardIcon(reward.rewardType)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                    <p className="text-sm text-gray-600">{getRewardValue(reward)}</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {reward.description}
              </p>

              {/* Points Required */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-lg font-bold text-purple-600">
                    {formatPoints(reward.pointCost)}
                  </span>
                  <span className="text-sm text-gray-500">points</span>
                </div>
                
                {currentPoints < reward.pointCost && (
                  <Badge variant="outline" className="text-xs">
                    Need {formatPoints(reward.pointCost - currentPoints)} more
                  </Badge>
                )}
              </div>

              {/* Expiration Warning */}
              {reward.validUntil && new Date(reward.validUntil) > new Date() && (
                <div className="flex items-center space-x-1 text-orange-600 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>Expires {new Date(reward.validUntil).toLocaleDateString()}</span>
                </div>
              )}

              {/* Availability Status */}
              {reward.maxRedemptions && (
                <div className="text-xs text-gray-500">
                  {reward.maxRedemptions - reward.totalRedeemed} remaining
                </div>
              )}

              {/* Redeem Button */}
              <Button
                className="w-full"
                variant={canRedeem(reward) ? "default" : "secondary"}
                disabled={!canRedeem(reward) || redeeming === reward.id || isLoading}
                onClick={() => handleRedeem(reward)}
              >
                {redeeming === reward.id ? (
                  "Redeeming..."
                ) : !canRedeem(reward) ? (
                  currentPoints < reward.pointCost ? "Not Enough Points" : "Unavailable"
                ) : (
                  "Redeem Now"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}