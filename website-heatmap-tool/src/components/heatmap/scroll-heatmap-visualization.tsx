'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { ScrollHeatmapData } from '@/types/tracking'

interface ScrollHeatmapVisualizationProps {
  websiteId: string
  url: string
  dateRange: { from: Date; to: Date }
}

export function ScrollHeatmapVisualization({ 
  websiteId, 
  url, 
  dateRange 
}: ScrollHeatmapVisualizationProps) {
  const [scrollData, setScrollData] = useState<ScrollHeatmapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadScrollData()
  }, [websiteId, url, dateRange])

  const loadScrollData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // For demo purposes, generate mock data
      const mockData: ScrollHeatmapData = {
        segments: [
          { depth: 0, percentage: 100, count: 1247 },
          { depth: 10, percentage: 95.2, count: 1187 },
          { depth: 20, percentage: 87.4, count: 1090 },
          { depth: 30, percentage: 78.9, count: 984 },
          { depth: 40, percentage: 68.3, count: 852 },
          { depth: 50, percentage: 55.7, count: 695 },
          { depth: 60, percentage: 42.1, count: 525 },
          { depth: 70, percentage: 28.6, count: 357 },
          { depth: 80, percentage: 16.8, count: 210 },
          { depth: 90, percentage: 8.4, count: 105 },
          { depth: 100, percentage: 3.2, count: 40 },
        ],
        averageScrollDepth: 52.4,
        maxScrollDepth: 100,
        totalViews: 1247,
        documentHeight: 2400,
      }

      setScrollData(mockData)
    } catch (err) {
      setError('Failed to load scroll data')
      console.error('Scroll data loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getSegmentColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 60) return 'bg-orange-500'
    if (percentage >= 40) return 'bg-yellow-500'
    if (percentage >= 20) return 'bg-blue-500'
    return 'bg-gray-300'
  }

  const getSegmentWidth = (percentage: number, maxPercentage: number) => {
    return (percentage / maxPercentage) * 100
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadScrollData}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!scrollData) return null

  const maxPercentage = Math.max(...scrollData.segments.map(s => s.percentage))

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Stats */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Badge variant="secondary">
                {scrollData.averageScrollDepth}% avg scroll depth
              </Badge>
              <Badge variant="outline">
                {scrollData.totalViews} total views
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              Page height: {scrollData.documentHeight}px
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{scrollData.averageScrollDepth}%</div>
              <div className="text-sm text-gray-600">Average Scroll</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {scrollData.segments.find(s => s.depth === 50)?.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Reach 50%</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {scrollData.segments.find(s => s.depth === 100)?.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Reach Bottom</div>
            </div>
          </div>

          {/* Scroll Depth Visualization */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Scroll Depth Distribution</h3>
            
            <div className="space-y-3">
              {scrollData.segments.map((segment, index) => (
                <div key={segment.depth} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium text-gray-600">
                    {segment.depth}%
                  </div>
                  
                  <div className="flex-1 relative">
                    <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getSegmentColor(segment.percentage)}`}
                        style={{ 
                          width: `${getSegmentWidth(segment.percentage, maxPercentage)}%` 
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
                        {segment.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {segment.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Page Fold Analysis */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Page Fold Analysis</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Above the fold (0-20%)</div>
                <div className="text-2xl font-bold text-green-600">
                  {scrollData.segments.find(s => s.depth === 20)?.percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">of users see this content</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Middle content (20-80%)</div>
                <div className="text-2xl font-bold text-orange-600">
                  {(
                    (scrollData.segments.find(s => s.depth === 20)?.percentage || 0) -
                    (scrollData.segments.find(s => s.depth === 80)?.percentage || 0)
                  ).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">engagement drop-off</div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Optimization Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {scrollData.averageScrollDepth < 50 && (
                <li>• Consider moving important content higher up the page</li>
              )}
              {scrollData.segments.find(s => s.depth === 100)?.percentage < 10 && (
                <li>• Many users don't reach the bottom - consider shorter content or better engagement</li>
              )}
              {scrollData.segments.find(s => s.depth === 50)?.percentage > 60 && (
                <li>• Good engagement! Users are interested in your content</li>
              )}
            </ul>
          </div>

          {/* Legend */}
          <div className="text-sm text-gray-600">
            <p>
              Scroll depth heatmap shows the percentage of users who scrolled to each depth level of the page. 
              Higher percentages indicate more users reached that point.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}