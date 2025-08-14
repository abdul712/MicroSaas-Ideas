'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Globe, HardDrive, Activity, Crown } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import Link from 'next/link'
import type { Subscription, Plan } from '@prisma/client'

interface UsageOverviewProps {
  subscription: Subscription | null
  plan: Plan
}

export function UsageOverview({ subscription, plan }: UsageOverviewProps) {
  const usageData = [
    {
      name: 'Portals',
      current: subscription?.portalCount || 0,
      limit: subscription?.portalLimit || 5,
      icon: Globe,
      color: 'text-blue-600'
    },
    {
      name: 'Storage',
      current: subscription?.storageUsed || 0,
      limit: subscription?.storageLimit || (10 * 1024 * 1024 * 1024), // 10GB
      icon: HardDrive,
      color: 'text-green-600',
      format: formatFileSize
    },
    {
      name: 'Bandwidth',
      current: subscription?.bandwidthUsed || 0,
      limit: subscription?.bandwidthLimit || (100 * 1024 * 1024 * 1024), // 100GB
      icon: Activity,
      color: 'text-purple-600',
      format: formatFileSize
    }
  ]

  const getPlanColor = (plan: Plan) => {
    switch (plan) {
      case 'STARTER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'PROFESSIONAL': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'AGENCY': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'ENTERPRISE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Usage Overview
              <Badge className={getPlanColor(plan)}>
                {plan.toLowerCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              Monitor your current usage and limits
            </CardDescription>
          </div>
          {plan === 'STARTER' && (
            <Button size="sm" asChild className="gap-1">
              <Link href="/dashboard/settings/billing">
                <Crown className="h-4 w-4" />
                Upgrade
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {usageData.map((usage) => {
          const percentage = (usage.current / usage.limit) * 100
          const isNearLimit = percentage > 80
          const formattedCurrent = usage.format ? usage.format(usage.current) : usage.current.toString()
          const formattedLimit = usage.format ? usage.format(usage.limit) : usage.limit.toString()

          return (
            <div key={usage.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <usage.icon className={`h-4 w-4 ${usage.color}`} />
                  <span className="text-sm font-medium">{usage.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">
                    {formattedCurrent}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {' '} / {formattedLimit}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={`h-2 ${isNearLimit ? 'progress-warning' : ''}`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(percentage)}% used</span>
                  {isNearLimit && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Near limit
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Upgrade prompt for starter plan */}
        {plan === 'STARTER' && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Need more resources?
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Upgrade to Professional for unlimited portals, 100GB storage, and advanced features.
                </p>
                <Button size="sm" className="mt-3" asChild>
                  <Link href="/dashboard/settings/billing">
                    Upgrade Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}