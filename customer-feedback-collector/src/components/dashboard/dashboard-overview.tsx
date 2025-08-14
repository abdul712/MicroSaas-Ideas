'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Star,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface DashboardOverviewProps {
  data?: {
    totalFeedback: number
    sentimentStats: Array<{ sentiment: string; _count: { sentiment: number } }>
    typeStats: Array<{ type: string; _count: { type: number } }>
    recentFeedback: any[]
    topTopics: Array<{ topic: string; count: number }>
  }
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  // Mock data for demo purposes
  const mockData = {
    totalFeedback: 1247,
    sentimentStats: [
      { sentiment: 'POSITIVE', _count: { sentiment: 623 } },
      { sentiment: 'NEUTRAL', _count: { sentiment: 374 } },
      { sentiment: 'NEGATIVE', _count: { sentiment: 250 } },
    ],
    typeStats: [
      { type: 'RATING', _count: { type: 456 } },
      { type: 'TEXT', _count: { type: 321 } },
      { type: 'NPS', _count: { type: 234 } },
      { type: 'FEATURE_REQUEST', _count: { type: 236 } },
    ],
    recentFeedback: [
      {
        id: '1',
        content: 'Great product! Love the new features.',
        sentiment: 'POSITIVE',
        type: 'RATING',
        rating: 5,
        createdAt: new Date().toISOString(),
        customer: { name: 'John Doe', email: 'john@example.com' },
      },
      {
        id: '2',
        content: 'The interface could be more intuitive.',
        sentiment: 'NEUTRAL',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        customer: { name: 'Jane Smith', email: 'jane@example.com' },
      },
    ],
    topTopics: [
      { topic: 'User Interface', count: 89 },
      { topic: 'Performance', count: 67 },
      { topic: 'Features', count: 54 },
      { topic: 'Support', count: 43 },
      { topic: 'Pricing', count: 32 },
    ],
  }

  const analytics = data || mockData

  const positivePercentage = analytics.sentimentStats.find(s => s.sentiment === 'POSITIVE')?._count.sentiment || 0
  const negativePercentage = analytics.sentimentStats.find(s => s.sentiment === 'NEGATIVE')?._count.sentiment || 0
  const npsScore = Math.round(((positivePercentage - negativePercentage) / analytics.totalFeedback) * 100)

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'text-green-600 bg-green-50'
      case 'NEGATIVE': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor your feedback collection and customer insights
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Widget
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFeedback.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 inline mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{npsScore}</div>
            <p className="text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 inline mr-1" />
              +5 points this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((positivePercentage / analytics.totalFeedback) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {positivePercentage} positive reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 widgets deployed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest customer submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentFeedback.map((feedback) => (
                <div key={feedback.id} className="flex items-start space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {feedback.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {feedback.customer?.name || 'Anonymous'} • {new Date(feedback.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getSentimentColor(feedback.sentiment)}>
                    {feedback.sentiment.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Top Topics</CardTitle>
            <CardDescription>Most discussed themes in feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topTopics.map((topic, index) => (
                <div key={topic.topic} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {topic.topic}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {topic.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
          <CardDescription>Breakdown of customer sentiment over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.sentimentStats.map((stat) => (
              <div key={stat.sentiment} className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(stat.sentiment)}`}>
                  {stat.sentiment.toLowerCase()}
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {stat._count.sentiment}
                </div>
                <div className="text-sm text-gray-500">
                  {Math.round((stat._count.sentiment / analytics.totalFeedback) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}