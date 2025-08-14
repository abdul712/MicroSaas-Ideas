import { NextRequest, NextResponse } from 'next/server'
import { SeoAnalyzer } from '@/services/seo-analyzer'
import { rateLimit } from '@/lib/rate-limit'
import { isValidUrl } from '@/lib/utils'

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Limit to 500 unique IPs per minute
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    try {
      await limiter.check(10, 'ANALYZE_ENDPOINT') // 10 requests per minute per IP
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { url } = body

    // Input validation
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      )
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Initialize SEO analyzer
    const analyzer = new SeoAnalyzer()
    
    // Perform SEO analysis
    const analysis = await analyzer.analyzeUrl(url)

    // Return analysis result
    return NextResponse.json({
      id: analysis.id,
      url: analysis.url,
      status: analysis.status,
      overallScore: analysis.overallScore,
      scores: analysis.scores,
      recommendations: analysis.recommendations,
      technicalIssues: analysis.technicalIssues,
      contentAnalysis: analysis.contentAnalysis,
      keywordAnalysis: analysis.keywordAnalysis,
      performanceMetrics: analysis.performanceMetrics,
      analyzedAt: analysis.analyzedAt,
    })

  } catch (error) {
    console.error('SEO analysis error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error during SEO analysis',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'seo-analyzer',
    timestamp: new Date().toISOString(),
  })
}