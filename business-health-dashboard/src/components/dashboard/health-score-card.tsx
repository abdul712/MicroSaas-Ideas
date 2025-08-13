'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Users, 
  Settings,
  MoreHorizontal,
  Info
} from 'lucide-react'
import { getHealthScoreColor, getHealthScoreLabel } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HealthScoreData {
  overall: number
  financial: number
  customer: number
  operations: number
  growth: number
  marketing: number
}

interface HealthScoreCardProps {
  healthScore: HealthScoreData
}

const scoreCategories = [
  { 
    key: 'financial' as keyof HealthScoreData, 
    label: 'Financial Health', 
    icon: DollarSign,
    description: 'Revenue, expenses, and cash flow metrics'
  },
  { 
    key: 'customer' as keyof HealthScoreData, 
    label: 'Customer Health', 
    icon: Users,
    description: 'Customer satisfaction, retention, and growth'
  },
  { 
    key: 'operations' as keyof HealthScoreData, 
    label: 'Operations', 
    icon: Settings,
    description: 'Operational efficiency and performance'
  },
  { 
    key: 'growth' as keyof HealthScoreData, 
    label: 'Growth', 
    icon: TrendingUp,
    description: 'Business growth and expansion metrics'
  },
  { 
    key: 'marketing' as keyof HealthScoreData, 
    label: 'Marketing', 
    icon: Activity,
    description: 'Marketing ROI and campaign performance'
  }
]

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const overallScore = healthScore.overall
  const overallLabel = getHealthScoreLabel(overallScore)
  const overallColor = getHealthScoreColor(overallScore)
  
  // Calculate trend (mock data - in real app, compare with previous period)
  const trendDirection = Math.random() > 0.5 ? 'up' : 'down'
  const trendValue = Math.floor(Math.random() * 10) + 1

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">Business Health Score</CardTitle>
          <CardDescription>
            Overall health assessment across all business areas
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={overallScore >= 75 ? 'default' : overallScore >= 50 ? 'secondary' : 'destructive'}
            className="text-sm"
          >
            {overallLabel}
          </Badge>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Score Circle */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-200"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${overallScore}, 100`}
                  className={`${overallColor} transition-all duration-1000 ease-in-out`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${overallColor}`}>
                    {overallScore}
                  </div>
                  <div className="text-sm text-gray-500">Score</div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  trendDirection === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {trendDirection === 'up' ? '+' : '-'}{trendValue} from last month
                </span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scoreCategories.map((category) => {
                const score = healthScore[category.key]
                const Icon = category.icon
                
                return (
                  <TooltipProvider key={category.key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-help">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-5 w-5 text-gray-600" />
                              <span className="font-medium text-sm">{category.label}</span>
                            </div>
                            <span className={`text-lg font-bold ${getHealthScoreColor(score)}`}>
                              {score}
                            </span>
                          </div>
                          <Progress 
                            value={score} 
                            className="h-2" 
                            style={{
                              '--progress-background': score >= 75 ? '#10B981' : 
                                                     score >= 50 ? '#F59E0B' : '#EF4444'
                            } as React.CSSProperties}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{category.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>

            {/* Action Items */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Recommendations</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Based on your current health score, here are priority actions to improve your business performance:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Focus on improving customer retention (Score: {healthScore.customer})</li>
                    <li>• Optimize marketing ROI to boost growth metrics</li>
                    <li>• Consider expense review to improve financial health</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}