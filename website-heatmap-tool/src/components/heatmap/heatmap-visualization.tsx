'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { HeatmapData } from '@/types/tracking'

interface HeatmapVisualizationProps {
  websiteId: string
  url: string
  dateRange: { from: Date; to: Date }
  type: 'clicks' | 'attention'
}

export function HeatmapVisualization({ 
  websiteId, 
  url, 
  dateRange, 
  type 
}: HeatmapVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHeatmapData()
  }, [websiteId, url, dateRange, type])

  const loadHeatmapData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // For demo purposes, generate mock data
      const mockData: HeatmapData = {
        points: generateMockHeatmapPoints(),
        maxIntensity: 50,
        totalClicks: 1247,
        viewport: { width: 1200, height: 800 },
        document: { width: 1200, height: 2400 },
        dateRange
      }

      setHeatmapData(mockData)
      renderHeatmap(mockData)
    } catch (err) {
      setError('Failed to load heatmap data')
      console.error('Heatmap loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockHeatmapPoints = () => {
    const points = []
    
    // Generate some realistic click patterns
    const hotspots = [
      { x: 600, y: 100, intensity: 0.9 }, // Header CTA
      { x: 300, y: 400, intensity: 0.7 }, // Main content area
      { x: 800, y: 600, intensity: 0.6 }, // Sidebar
      { x: 600, y: 1200, intensity: 0.8 }, // Footer CTA
      { x: 400, y: 800, intensity: 0.5 }, // Middle content
    ]

    hotspots.forEach((hotspot, index) => {
      // Create a cluster of points around each hotspot
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * 2 * Math.PI
        const distance = Math.random() * 100
        const x = hotspot.x + Math.cos(angle) * distance
        const y = hotspot.y + Math.sin(angle) * distance
        
        points.push({
          x: Math.max(0, Math.min(1200, x)),
          y: Math.max(0, Math.min(2400, y)),
          intensity: Math.max(0.1, hotspot.intensity - (distance / 200)),
          count: Math.floor(hotspot.intensity * 50)
        })
      }
    })

    return points
  }

  const renderHeatmap = (data: HeatmapData) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const displayWidth = 800
    const displayHeight = (data.document.height / data.document.width) * displayWidth
    
    canvas.width = displayWidth
    canvas.height = displayHeight
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight)

    // Draw background
    ctx.fillStyle = 'rgba(240, 242, 247, 0.8)'
    ctx.fillRect(0, 0, displayWidth, displayHeight)

    // Draw mock page structure
    drawMockPageStructure(ctx, displayWidth, displayHeight)

    // Draw heatmap points
    data.points.forEach(point => {
      const scaledX = (point.x / data.document.width) * displayWidth
      const scaledY = (point.y / data.document.height) * displayHeight
      const radius = Math.max(10, point.intensity * 40)

      // Create radial gradient based on intensity
      const gradient = ctx.createRadialGradient(scaledX, scaledY, 0, scaledX, scaledY, radius)
      
      if (type === 'clicks') {
        gradient.addColorStop(0, `rgba(255, 0, 0, ${point.intensity * 0.7})`)
        gradient.addColorStop(0.3, `rgba(255, 100, 0, ${point.intensity * 0.5})`)
        gradient.addColorStop(0.7, `rgba(255, 255, 0, ${point.intensity * 0.3})`)
        gradient.addColorStop(1, `rgba(0, 0, 255, ${point.intensity * 0.1})`)
      } else {
        gradient.addColorStop(0, `rgba(128, 0, 128, ${point.intensity * 0.7})`)
        gradient.addColorStop(0.5, `rgba(255, 0, 255, ${point.intensity * 0.4})`)
        gradient.addColorStop(1, `rgba(0, 255, 255, ${point.intensity * 0.1})`)
      }

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(scaledX, scaledY, radius, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Apply blend mode for better heatmap effect
    ctx.globalCompositeOperation = 'multiply'
  }

  const drawMockPageStructure = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Header
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillRect(0, 0, width, 80)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.strokeRect(0, 0, width, 80)

    // Navigation
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    ctx.fillRect(50, 20, 600, 40)

    // Main content area
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillRect(50, 120, width - 300, height - 300)
    ctx.strokeRect(50, 120, width - 300, height - 300)

    // Sidebar
    ctx.fillStyle = 'rgba(249, 250, 251, 0.9)'
    ctx.fillRect(width - 200, 120, 150, 400)
    ctx.strokeRect(width - 200, 120, 150, 400)

    // Footer
    ctx.fillStyle = 'rgba(31, 41, 55, 0.1)'
    ctx.fillRect(0, height - 150, width, 150)
    ctx.strokeRect(0, height - 150, width, 150)

    // CTA buttons
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
    ctx.fillRect(500, 60, 120, 40) // Header CTA
    ctx.fillRect(500, height - 100, 120, 40) // Footer CTA
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
              onClick={loadHeatmapData}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Badge variant="secondary">
                {heatmapData?.totalClicks} {type === 'clicks' ? 'clicks' : 'interactions'}
              </Badge>
              <Badge variant="outline">
                {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Intensity:</span>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-blue-200 rounded"></div>
                <span className="text-xs">Low</span>
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="text-xs">Medium</span>
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs">High</span>
              </div>
            </div>
          </div>

          {/* Heatmap Canvas */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-w-full"
              style={{ maxHeight: '600px' }}
            />
          </div>

          {/* Legend */}
          <div className="text-sm text-gray-600">
            <p>
              {type === 'clicks' ? 'Click heatmap' : 'Attention heatmap'} showing user interaction intensity. 
              Red areas indicate high activity, blue areas indicate low activity.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}