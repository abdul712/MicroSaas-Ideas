'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Download, Share2, RefreshCw, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SeoScoreCircle } from '@/components/analysis/seo-score-circle'
import { RecommendationsList } from '@/components/analysis/recommendations-list'
import { TechnicalIssuesList } from '@/components/analysis/technical-issues-list'
import { ContentAnalysisCard } from '@/components/analysis/content-analysis-card'
import { KeywordAnalysisCard } from '@/components/analysis/keyword-analysis-card'
import { PerformanceMetricsCard } from '@/components/analysis/performance-metrics-card'
import { useToast } from '@/hooks/use-toast'
import { SeoAnalysisResult } from '@/services/seo-analyzer'
import { extractDomain, formatDateTime } from '@/lib/utils'

interface AnalysisResultsProps {
  analysisId: string
}

export function AnalysisResults({ analysisId }: AnalysisResultsProps) {
  const [analysis, setAnalysis] = useState<SeoAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalysis()
  }, [analysisId])

  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/seo/analysis/${analysisId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Analysis not found')
        } else {
          setError('Failed to load analysis')
        }
        return
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (error) {
      console.error('Error fetching analysis:', error)
      setError('Failed to load analysis')
    } finally {
      setLoading(false)
    }
  }

  const handleReanalyze = async () => {
    if (!analysis?.url) return

    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: analysis.url }),
      })

      if (!response.ok) {
        throw new Error('Re-analysis failed')
      }

      const result = await response.json()
      window.location.href = `/analysis/${result.id}`
    } catch (error) {
      toast({
        title: "Re-analysis Failed",
        description: "Unable to re-analyze the URL. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SEO Analysis Results',
          text: `Check out the SEO analysis for ${analysis?.url}`,
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link Copied",
          description: "Analysis link copied to clipboard!",
          variant: "success",
        })
      } catch (error) {
        toast({
          title: "Share Failed",
          description: "Unable to copy link to clipboard.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownload = () => {
    if (!analysis) return

    const reportData = {
      url: analysis.url,
      analyzedAt: analysis.analyzedAt,
      overallScore: analysis.overallScore,
      scores: analysis.scores,
      recommendations: analysis.recommendations,
      technicalIssues: analysis.technicalIssues,
      contentAnalysis: analysis.contentAnalysis,
      keywordAnalysis: analysis.keywordAnalysis,
      performanceMetrics: analysis.performanceMetrics,
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-analysis-${extractDomain(analysis.url)}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Report Downloaded",
      description: "SEO analysis report has been downloaded successfully.",
      variant: "success",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analysis Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The requested SEO analysis could not be found.'}
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (analysis.status === 'FAILED') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analysis Failed</h1>
          <p className="text-gray-600 mb-6">
            The SEO analysis for {analysis.url} could not be completed.
          </p>
          <div className="space-x-4">
            <Button onClick={handleReanalyze}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="mb-4 lg:mb-0">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Analysis Results</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{extractDomain(analysis.url)}</span>
            <span>•</span>
            <span>{analysis.analyzedAt && formatDateTime(analysis.analyzedAt)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleReanalyze}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-analyze
          </Button>
        </div>
      </div>

      {/* Overall Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Overall SEO Score</CardTitle>
              <CardDescription>Based on technical, content, and performance factors</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <SeoScoreCircle score={analysis.overallScore || 0} size={120} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
              <CardDescription>Individual performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.scores && Object.entries(analysis.scores).map(([category, score]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize font-medium">{category.replace('_', ' ')}</span>
                    <span className="font-bold">{score}/100</span>
                  </div>
                  <Progress 
                    value={score} 
                    className="h-2"
                    indicatorClassName={
                      score >= 80 ? 'bg-green-500' :
                      score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analysis Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {analysis.contentAnalysis && (
          <ContentAnalysisCard analysis={analysis.contentAnalysis} />
        )}
        
        {analysis.keywordAnalysis && (
          <KeywordAnalysisCard analysis={analysis.keywordAnalysis} />
        )}
        
        {analysis.performanceMetrics && (
          <PerformanceMetricsCard metrics={analysis.performanceMetrics} />
        )}

        {analysis.technicalIssues && analysis.technicalIssues.length > 0 && (
          <TechnicalIssuesList issues={analysis.technicalIssues} />
        )}
      </div>

      {/* Recommendations Section */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              SEO Recommendations
            </CardTitle>
            <CardDescription>
              Prioritized action items to improve your SEO score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecommendationsList recommendations={analysis.recommendations} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}