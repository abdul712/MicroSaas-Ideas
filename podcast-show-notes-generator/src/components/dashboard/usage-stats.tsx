'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  Crown, 
  TrendingUp, 
  Calendar,
  AlertTriangle
} from 'lucide-react'

interface UsageStatsProps {
  creditsUsed: number
  monthlyCredits: number
  subscriptionPlan: string
}

export function UsageStats({ creditsUsed, monthlyCredits, subscriptionPlan }: UsageStatsProps) {
  const usagePercentage = (creditsUsed / monthlyCredits) * 100
  const remainingCredits = monthlyCredits - creditsUsed

  const planConfig = {
    STARTER: {
      name: 'Starter',
      color: 'outline',
      nextPlan: 'Professional',
      features: ['10 hours/month', 'Basic features', 'Email support']
    },
    PROFESSIONAL: {
      name: 'Professional',
      color: 'secondary',
      nextPlan: 'Enterprise',
      features: ['50 hours/month', 'Advanced features', 'Priority support']
    },
    ENTERPRISE: {
      name: 'Enterprise',
      color: 'default',
      nextPlan: null,
      features: ['Unlimited hours', 'All features', 'Dedicated support']
    }
  }

  const currentPlan = planConfig[subscriptionPlan as keyof typeof planConfig] || planConfig.STARTER

  return (
    <div className="space-y-6">
      {/* Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-podcast-600 mr-2" />
              Usage This Month
            </div>
            <Badge variant={currentPlan.color as any}>
              {currentPlan.name}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Usage bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {creditsUsed} of {monthlyCredits} hours used
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(usagePercentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    usagePercentage > 90 
                      ? 'bg-red-500' 
                      : usagePercentage > 75 
                      ? 'bg-yellow-500' 
                      : 'bg-podcast-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Remaining credits */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Remaining credits
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {remainingCredits} hours
              </span>
            </div>

            {/* Warning if usage is high */}
            {usagePercentage > 80 && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Running low on credits
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                    Consider upgrading your plan to avoid interruptions.
                  </p>
                </div>
              </div>
            )}

            {/* Upgrade CTA */}
            {currentPlan.nextPlan && (
              <Link href="/dashboard/billing">
                <Button 
                  variant="podcast" 
                  size="sm" 
                  className="w-full"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to {currentPlan.nextPlan}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 text-podcast-600 mr-2" />
            Your Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm">
                <div className="w-1.5 h-1.5 bg-podcast-600 rounded-full mr-3"></div>
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/dashboard/billing">
              <Button variant="outline" size="sm" className="w-full">
                Manage Subscription
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 text-podcast-600 mr-2" />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Episodes processed</span>
              <span className="font-medium text-gray-900 dark:text-white">12</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Avg. processing time</span>
              <span className="font-medium text-gray-900 dark:text-white">2.3 min</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Export downloads</span>
              <span className="font-medium text-gray-900 dark:text-white">8</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/dashboard/analytics">
              <Button variant="outline" size="sm" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}