'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Globe, FileText, MessageSquare, MoreVertical, ExternalLink } from 'lucide-react'
import { formatDateTime, getInitials } from '@/lib/utils'
import type { PortalWithRelations } from '@/types'

interface RecentPortalsProps {
  portals: (PortalWithRelations & {
    _count: {
      files: number
      messages: number
    }
  })[]
}

export function RecentPortals({ portals }: RecentPortalsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Portals</CardTitle>
            <CardDescription>
              Your latest client portals and their activity
            </CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href="/dashboard/portals">
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {portals.length === 0 ? (
          <div className="text-center py-8">
            <Globe className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No portals yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first client portal.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/dashboard/portals/new">
                  Create Portal
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {portals.map((portal) => (
              <div
                key={portal.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(portal.client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {portal.name}
                      </p>
                      <Badge
                        variant={portal.status === 'PUBLISHED' ? 'success' : 'secondary'}
                        className="text-xs"
                      >
                        {portal.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {portal.client.name} • {portal.client.company}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="flex items-center text-xs text-gray-500">
                        <FileText className="mr-1 h-3 w-3" />
                        {portal._count.files} files
                      </span>
                      <span className="flex items-center text-xs text-gray-500">
                        <MessageSquare className="mr-1 h-3 w-3" />
                        {portal._count.messages} messages
                      </span>
                      <span className="text-xs text-gray-500">
                        Updated {formatDateTime(portal.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/dashboard/portals/${portal.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}