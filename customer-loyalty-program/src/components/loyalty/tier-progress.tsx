'use client'

import { motion } from 'framer-motion'
import { Crown, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatPoints, getTierGradient } from '@/lib/utils'

interface TierProgressProps {
  currentTier: {
    name: string
    color: string
    minPoints: number
  }
  nextTier?: {
    name: string
    color: string
    minPoints: number
  }
  currentPoints: number
  pointsToNext?: number
}

export function TierProgress({
  currentTier,
  nextTier,
  currentPoints,
  pointsToNext
}: TierProgressProps) {
  const progress = nextTier 
    ? ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Tier Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge 
            className={`tier-badge bg-gradient-to-r ${getTierGradient(currentTier.name)}`}
          >
            {currentTier.name}
          </Badge>
          {nextTier && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>{formatPoints(pointsToNext || 0)} to {nextTier.name}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatPoints(currentTier.minPoints)}</span>
            {nextTier ? (
              <span>{formatPoints(nextTier.minPoints)}</span>
            ) : (
              <span>Max Tier</span>
            )}
          </div>
        </div>

        {nextTier && (
          <motion.div
            className="p-3 bg-muted rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-sm font-medium mb-1">Next Tier Benefits</div>
            <div className="text-sm text-muted-foreground">
              Unlock exclusive rewards and higher earning rates when you reach {nextTier.name}!
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}