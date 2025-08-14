import { Zap, Smartphone, Shield, Gauge } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PerformanceMetrics } from '@/services/seo-analyzer'

interface PerformanceMetricsCardProps {
  metrics: PerformanceMetrics
}

export function PerformanceMetricsCard({ metrics }: PerformanceMetricsCardProps) {
  const getLoadTimeStatus = (loadTime: number) => {
    if (loadTime < 1500) return { variant: 'excellent' as const, label: 'Excellent', score: 100 }
    if (loadTime < 2500) return { variant: 'good' as const, label: 'Good', score: 80 }
    if (loadTime < 4000) return { variant: 'fair' as const, label: 'Fair', score: 60 }
    return { variant: 'poor' as const, label: 'Poor', score: 30 }
  }

  const getLCPStatus = (lcp: number) => {
    if (lcp < 2500) return { variant: 'excellent' as const, label: 'Good', score: 90 }
    if (lcp < 4000) return { variant: 'fair' as const, label: 'Needs Improvement', score: 60 }
    return { variant: 'poor' as const, label: 'Poor', score: 30 }
  }

  const getCLSStatus = (cls: number) => {
    if (cls < 0.1) return { variant: 'excellent' as const, label: 'Good', score: 90 }
    if (cls < 0.25) return { variant: 'fair' as const, label: 'Needs Improvement', score: 60 }
    return { variant: 'poor' as const, label: 'Poor', score: 30 }
  }

  const getFIDStatus = (fid: number) => {
    if (fid < 100) return { variant: 'excellent' as const, label: 'Good', score: 90 }
    if (fid < 300) return { variant: 'fair' as const, label: 'Needs Improvement', score: 60 }
    return { variant: 'poor' as const, label: 'Poor', score: 30 }
  }

  const loadTimeStatus = getLoadTimeStatus(metrics.loadTime)
  const lcpStatus = getLCPStatus(metrics.largestContentfulPaint)
  const clsStatus = getCLSStatus(metrics.cumulativeLayoutShift)
  const fidStatus = getFIDStatus(metrics.firstInputDelay)

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gauge className="h-5 w-5 mr-2" />
          Performance Metrics
        </CardTitle>
        <CardDescription>
          Core Web Vitals and performance indicators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Web Vitals */}
        <div className="space-y-4">
          <div className="font-medium">Core Web Vitals</div>
          
          {/* Largest Contentful Paint */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Largest Contentful Paint (LCP)</span>
              <Badge variant={lcpStatus.variant}>{lcpStatus.label}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Time to largest content element</span>
              <span className="font-semibold">{formatTime(metrics.largestContentfulPaint)}</span>
            </div>
            <Progress value={lcpStatus.score} className="h-2" />
          </div>

          {/* First Input Delay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">First Input Delay (FID)</span>
              <Badge variant={fidStatus.variant}>{fidStatus.label}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Response time to first interaction</span>
              <span className="font-semibold">{formatTime(metrics.firstInputDelay)}</span>
            </div>
            <Progress value={fidStatus.score} className="h-2" />
          </div>

          {/* Cumulative Layout Shift */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cumulative Layout Shift (CLS)</span>
              <Badge variant={clsStatus.variant}>{clsStatus.label}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Visual stability score</span>
              <span className="font-semibold">{metrics.cumulativeLayoutShift.toFixed(3)}</span>
            </div>
            <Progress value={clsStatus.score} className="h-2" />
          </div>
        </div>

        {/* Loading Performance */}
        <div className="space-y-3">
          <div className="font-medium">Loading Performance</div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Load Time</span>
              <Badge variant={loadTimeStatus.variant}>{loadTimeStatus.label}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Complete page load</span>
              <span className="font-semibold">{formatTime(metrics.loadTime)}</span>
            </div>
            <Progress value={loadTimeStatus.score} className="h-2" />
          </div>

          <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-sm">First Contentful Paint</span>
            <span className="font-semibold text-sm">{formatTime(metrics.firstContentfulPaint)}</span>
          </div>
        </div>

        {/* Technical Checks */}
        <div className="space-y-3">
          <div className="font-medium">Technical Checks</div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">HTTPS Enabled</span>
              </div>
              <Badge variant={metrics.httpsEnabled ? 'excellent' : 'critical'}>
                {metrics.httpsEnabled ? 'Yes' : 'No'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center">
                <Smartphone className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Mobile Optimized</span>
              </div>
              <Badge variant={metrics.mobileOptimized ? 'excellent' : 'warning'}>
                {metrics.mobileOptimized ? 'Yes' : 'Needs Work'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Compression Enabled</span>
              </div>
              <Badge variant={metrics.compressionEnabled ? 'excellent' : 'warning'}>
                {metrics.compressionEnabled ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Performance Recommendations */}
        <div className="space-y-3">
          <div className="font-medium">Recommendations</div>
          <div className="space-y-2 text-sm">
            {metrics.loadTime > 3000 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                <span>Optimize images and enable compression to reduce load time</span>
              </div>
            )}
            
            {metrics.largestContentfulPaint > 2500 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                <span>Optimize your largest content element (images, videos, text blocks)</span>
              </div>
            )}
            
            {metrics.cumulativeLayoutShift > 0.1 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                <span>Add size attributes to images and ads to prevent layout shifts</span>
              </div>
            )}
            
            {!metrics.httpsEnabled && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                <span>Enable HTTPS for better security and SEO rankings</span>
              </div>
            )}
            
            {!metrics.compressionEnabled && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <span>Enable GZIP compression to reduce file sizes</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}