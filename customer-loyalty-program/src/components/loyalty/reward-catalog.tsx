'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, ShoppingCart, Star, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPoints, formatCurrency } from '@/lib/utils'

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  value?: number
  category: string
  imageUrl?: string
  type: string
}

interface RewardCatalogProps {
  rewards: Reward[]
  availablePoints: number
  onRedeem: (rewardId: string) => void
}

export function RewardCatalog({ rewards, availablePoints, onRedeem }: RewardCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const categories = ['all', ...Array.from(new Set(rewards.map(r => r.category)))]
  
  const filteredRewards = selectedCategory === 'all' 
    ? rewards 
    : rewards.filter(r => r.category === selectedCategory)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Reward Catalog
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRewards.map((reward, index) => {
            const canRedeem = availablePoints >= reward.pointsCost
            
            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Card className={`h-full transition-all duration-200 ${
                  canRedeem 
                    ? 'hover:shadow-lg hover:-translate-y-1' 
                    : 'opacity-60'
                }`}>
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                      {reward.imageUrl ? (
                        <img 
                          src={reward.imageUrl} 
                          alt={reward.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Gift className="h-12 w-12 text-purple-600" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight">
                          {reward.name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {reward.category}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {reward.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm font-semibold">
                            {formatPoints(reward.pointsCost)}
                          </span>
                        </div>
                        {reward.value && (
                          <span className="text-xs text-muted-foreground">
                            Worth {formatCurrency(reward.value)}
                          </span>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={!canRedeem}
                        onClick={() => onRedeem(reward.id)}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {canRedeem ? 'Redeem' : 'Insufficient Points'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        
        {filteredRewards.length === 0 && (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No rewards available in this category</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}