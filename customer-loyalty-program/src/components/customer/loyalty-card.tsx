"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Crown, 
  Star, 
  Gift, 
  TrendingUp,
  Sparkles
} from "lucide-react"
import { formatPoints, getTierColor } from "@/lib/utils"

interface LoyaltyCardProps {
  membership: {
    memberNumber: string
    currentPoints: number
    lifetimePoints: number
    currentTier: string | null
    program: {
      name: string
      business: {
        name: string
        primaryColor: string
        secondaryColor: string
        logo?: string
      }
    }
  }
  pointsToNextTier?: number
  nextTierName?: string
}

export function LoyaltyCard({ membership, pointsToNextTier, nextTierName }: LoyaltyCardProps) {
  const { program } = membership
  const { business } = program
  const tierColor = getTierColor(membership.currentTier)
  
  const progressPercentage = pointsToNextTier && nextTierName
    ? Math.max(0, Math.min(100, ((membership.currentPoints) / (membership.currentPoints + pointsToNextTier)) * 100))
    : 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="overflow-hidden relative">
        {/* Background Gradient */}
        <div 
          className="absolute inset-0 opacity-90"
          style={{
            background: `linear-gradient(135deg, ${business.primaryColor || '#667eea'} 0%, ${business.secondaryColor || '#764ba2'} 100%)`
          }}
        />
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Crown className="w-16 h-16 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <Sparkles className="w-24 h-24 text-white" />
        </div>
        
        <CardContent className="relative z-10 p-6 text-white">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold">{business.name}</h3>
              <p className="text-white/80 text-sm">{program.name}</p>
            </div>
            {business.logo && (
              <img
                src={business.logo}
                alt={`${business.name} logo`}
                className="w-12 h-12 rounded-lg bg-white/20 p-2"
              />
            )}
          </div>

          {/* Member Number */}
          <div className="mb-6">
            <p className="text-white/60 text-xs mb-1">Member Number</p>
            <p className="font-mono text-sm tracking-wider">{membership.memberNumber}</p>
          </div>

          {/* Points Display */}
          <div className="mb-6">
            <div className="flex items-end space-x-2 mb-2">
              <motion.span 
                className="text-3xl font-bold points-glow"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {formatPoints(membership.currentPoints)}
              </motion.span>
              <span className="text-white/80 text-lg mb-1">points</span>
            </div>
            <p className="text-white/60 text-xs">
              Lifetime: {formatPoints(membership.lifetimePoints)} points
            </p>
          </div>

          {/* Tier Status */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">Current Tier</span>
              {membership.currentTier && (
                <Badge 
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: tierColor, color: 'white' }}
                >
                  <Star className="w-3 h-3 mr-1" />
                  {membership.currentTier}
                </Badge>
              )}
            </div>
            
            {/* Progress to Next Tier */}
            {pointsToNextTier && nextTierName && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/80">
                  <span>Progress to {nextTierName}</span>
                  <span>{pointsToNextTier} points to go</span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2 bg-white/20"
                />
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Gift className="w-4 h-4 text-white/80" />
              </div>
              <p className="text-xs text-white/60">Rewards</p>
              <p className="text-sm font-medium">Available</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-white/80" />
              </div>
              <p className="text-xs text-white/60">Level</p>
              <p className="text-sm font-medium">{membership.currentTier || 'Bronze'}</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Star className="w-4 h-4 text-white/80" />
              </div>
              <p className="text-xs text-white/60">Status</p>
              <p className="text-sm font-medium">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}