'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Users, FileText, HardDrive, MessageSquare, Eye } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

interface DashboardStatsProps {
  stats: {
    totalPortals: number
    activeClients: number
    totalFiles: number
    storageUsed: number
    messagesThisMonth: number
    portalViews: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Total Portals',
      value: stats.totalPortals.toString(),
      description: 'Active client portals',
      icon: Globe,
      trend: '+2 this week'
    },
    {
      title: 'Active Clients',
      value: stats.activeClients.toString(),
      description: 'Clients with access',
      icon: Users,
      trend: '+1 this week'
    },
    {
      title: 'Total Files',
      value: stats.totalFiles.toString(),
      description: 'Files shared',
      icon: FileText,
      trend: '+12 this week'
    },
    {
      title: 'Storage Used',
      value: formatFileSize(stats.storageUsed),
      description: 'Of 10GB available',
      icon: HardDrive,
      trend: `${Math.round((stats.storageUsed / (10 * 1024 * 1024 * 1024)) * 100)}% used`
    },
    {
      title: 'Messages',
      value: stats.messagesThisMonth.toString(),
      description: 'This month',
      icon: MessageSquare,
      trend: '+5 today'
    },
    {
      title: 'Portal Views',
      value: stats.portalViews.toString(),
      description: 'This month',
      icon: Eye,
      trend: '+23 today'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat, index) => (
        <Card key={index} className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <Badge variant="secondary" className="text-xs">
                {stat.trend}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}