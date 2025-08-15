'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime, formatDuration } from '@/lib/utils'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react'

interface Episode {
  id: string
  title: string
  createdAt: Date
  duration: number | null
  processingStatus: string
  podcastName: string
  transcription?: any
  showNotes?: any
}

interface RecentEpisodesProps {
  episodes: Episode[]
}

const statusConfig = {
  PENDING: { 
    label: 'Pending', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    icon: Clock 
  },
  UPLOADING: { 
    label: 'Uploading', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: Clock 
  },
  TRANSCRIBING: { 
    label: 'Transcribing', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: AlertCircle 
  },
  GENERATING: { 
    label: 'Generating', 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    icon: AlertCircle 
  },
  COMPLETED: { 
    label: 'Completed', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: CheckCircle 
  },
  FAILED: { 
    label: 'Failed', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: XCircle 
  },
}

export function RecentEpisodes({ episodes }: RecentEpisodesProps) {
  if (episodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 text-podcast-600 mr-2" />
            Recent Episodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No episodes yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Upload your first audio file to get started with AI-powered show notes.
            </p>
            <Link href="/dashboard/upload">
              <Button variant="podcast">
                Upload Audio File
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 text-podcast-600 mr-2" />
          Recent Episodes
        </CardTitle>
        <Link href="/dashboard/episodes">
          <Button variant="outline" size="sm">
            View all
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {episodes.map((episode) => {
            const status = statusConfig[episode.processingStatus as keyof typeof statusConfig] || statusConfig.PENDING
            const StatusIcon = status.icon

            return (
              <div
                key={episode.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-podcast-200 dark:hover:border-podcast-700 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-podcast-100 dark:bg-podcast-900/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-podcast-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {episode.title}
                      </h3>
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">{episode.podcastName}</span>
                      {episode.duration && (
                        <span>{formatDuration(episode.duration)}</span>
                      )}
                      <span>{formatRelativeTime(new Date(episode.createdAt))}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {episode.processingStatus === 'COMPLETED' && (
                    <Link href={`/dashboard/episodes/${episode.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                  
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}