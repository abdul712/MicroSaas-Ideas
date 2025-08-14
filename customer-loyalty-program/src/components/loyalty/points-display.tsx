'use client'

import { motion } from 'framer-motion'
import { Star, Gift, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPoints } from '@/lib/utils'

interface PointsDisplayProps {
  totalPoints: number
  availablePoints: number
  tier: {
    name: string
    color: string
  }
  isAnimating?: boolean
}

export function PointsDisplay({
  totalPoints,
  availablePoints,
  tier,
  isAnimating = false
}: PointsDisplayProps) {
  return (
    <Card className="loyalty-gradient text-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="h-5 w-5" />
            Your Points
          </CardTitle>
          <Badge 
            className={`tier-badge bg-white text-gray-900 hover:bg-gray-100`}
            style={{ backgroundColor: tier.color, color: 'white' }}
          >
            {tier.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <motion.div
            className="text-center"
            animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <div className="text-4xl font-bold mb-1">
              {formatPoints(availablePoints)}
            </div>
            <div className="text-white/80 text-sm">
              Available Points
            </div>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-white/90 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Total Earned</span>
              </div>
              <div className="text-lg font-semibold">
                {formatPoints(totalPoints)}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-white/90 mb-1">
                <Gift className="h-4 w-4" />
                <span className="text-xs">Redeemable</span>
              </div>
              <div className="text-lg font-semibold">
                {formatPoints(availablePoints)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}