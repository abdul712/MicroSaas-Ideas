'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Zap, 
  TrendingUp,
  Calendar
} from 'lucide-react'

interface DashboardOverviewProps {
  stats: {
    totalEpisodes: number
    completedEpisodes: number
    processingEpisodes: number
    creditsUsed: number
    monthlyCredits: number
    subscriptionPlan: string
  }
}

export function DashboardOverview({ stats }: DashboardOverviewProps) {
  const creditUsagePercentage = (stats.creditsUsed / stats.monthlyCredits) * 100

  const overviewCards = [
    {
      title: 'Total Episodes',
      value: stats.totalEpisodes.toString(),
      description: 'Episodes processed',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Completed',
      value: stats.completedEpisodes.toString(),
      description: 'Successfully processed',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Processing',
      value: stats.processingEpisodes.toString(),
      description: 'Currently in queue',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'Credits Used',
      value: `${stats.creditsUsed}/${stats.monthlyCredits}`,
      description: 'Hours transcribed',
      icon: Zap,
      color: 'text-podcast-600',
      bgColor: 'bg-podcast-50 dark:bg-podcast-900/20'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {overviewCards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {card.description}
            </p>
            
            {/* Special handling for credits card */}
            {card.title === 'Credits Used' && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      creditUsagePercentage > 80 
                        ? 'bg-red-500' 
                        : creditUsagePercentage > 60 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(creditUsagePercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {Math.round(creditUsagePercentage)}% used
                  </span>
                  <Badge variant={
                    stats.subscriptionPlan === 'ENTERPRISE' ? 'default' :
                    stats.subscriptionPlan === 'PROFESSIONAL' ? 'secondary' : 'outline'
                  } className="text-xs">
                    {stats.subscriptionPlan.toLowerCase()}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}