import { NextRequest, NextResponse } from 'next/server'

// Mock storage for analysis results (in production, use database)
const analysisStore = new Map<string, any>()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    // In production, you would fetch from database
    // For now, return mock data or actual stored results
    const analysis = analysisStore.get(id)
    
    if (!analysis) {
      // Return mock data for demonstration
      const mockAnalysis = {
        id,
        url: 'https://example.com',
        title: 'Example Website',
        metaDescription: 'This is an example website for SEO analysis demonstration.',
        status: 'COMPLETED',
        overallScore: 78,
        scores: {
          technical: 85,
          content: 72,
          keywords: 68,
          performance: 82,
          meta: 90
        },
        recommendations: [
          {
            id: 'improve_content_length',
            category: 'content',
            priority: 'medium',
            title: 'Increase Content Length',
            description: 'Your content is shorter than recommended. Longer content typically performs better in search results.',
            impact: 70,
            effort: 40,
            howToFix: 'Expand your content to at least 500 words with valuable, relevant information.\n\nAdd more detailed explanations, examples, and related subtopics to provide comprehensive coverage of your main topic.',
            examples: [
              'Add more detailed explanations of key concepts',
              'Include relevant examples and case studies',
              'Expand on related subtopics',
              'Add frequently asked questions section'
            ]
          },
          {
            id: 'optimize_keywords',
            category: 'keywords',
            priority: 'high',
            title: 'Optimize Keyword Usage',
            description: 'Your primary keywords are not well-distributed throughout the content.',
            impact: 85,
            effort: 50,
            howToFix: 'Ensure your primary keyword appears in:\n- Title tag\n- Meta description\n- H1 heading\n- First paragraph\n- Throughout the content naturally\n\nAvoid keyword stuffing - aim for 1-2% keyword density.',
            examples: [
              'Include primary keyword in title tag',
              'Use keyword in meta description',
              'Add keyword to H1 and H2 headings',
              'Use related keywords and synonyms'
            ]
          },
          {
            id: 'improve_page_speed',
            category: 'performance',
            priority: 'high',
            title: 'Improve Page Loading Speed',
            description: 'Your page takes longer than 3 seconds to load, which can hurt both user experience and search rankings.',
            impact: 90,
            effort: 70,
            howToFix: 'Optimize your page speed by:\n- Compressing images\n- Minimizing CSS and JavaScript\n- Enabling browser caching\n- Using a Content Delivery Network (CDN)\n- Optimizing server response time',
            examples: [
              'Compress and optimize images',
              'Minify CSS and JavaScript files',
              'Enable GZIP compression',
              'Implement browser caching',
              'Use a CDN for static assets'
            ]
          }
        ],
        technicalIssues: [
          {
            type: 'missing_meta_description',
            severity: 'warning',
            message: 'Meta description is missing or too short',
            suggestion: 'Add a compelling meta description of 150-160 characters to improve click-through rates from search results.'
          },
          {
            type: 'images_without_alt',
            severity: 'warning',
            message: '3 images without alt text',
            suggestion: 'Add descriptive alt text to all images for better accessibility and SEO.'
          },
          {
            type: 'multiple_h1',
            severity: 'critical',
            message: 'Multiple H1 tags found',
            suggestion: 'Use only one H1 tag per page. Convert additional H1 tags to H2 or H3.'
          }
        ],
        contentAnalysis: {
          wordCount: 285,
          readabilityScore: 68,
          headingStructure: {
            h1Count: 2,
            h2Count: 1,
            h3Count: 0,
            missingHeadings: ['H3']
          },
          imageAnalysis: {
            totalImages: 5,
            imagesWithoutAlt: 3,
            largeImages: 1
          },
          internalLinks: 4,
          externalLinks: 2,
          textToHtmlRatio: 12.5
        },
        keywordAnalysis: {
          primaryKeywords: ['seo analysis', 'website optimization', 'search engine'],
          keywordDensity: {
            'seo': 2.1,
            'analysis': 1.8,
            'website': 1.5,
            'optimization': 1.2,
            'search': 1.0,
            'content': 0.8,
            'keywords': 0.7
          },
          keywordCannibalization: false,
          missingKeywords: [],
          overOptimization: false
        },
        performanceMetrics: {
          loadTime: 3250,
          firstContentfulPaint: 1800,
          largestContentfulPaint: 2900,
          cumulativeLayoutShift: 0.15,
          firstInputDelay: 120,
          mobileOptimized: true,
          httpsEnabled: true,
          compressionEnabled: false
        },
        analyzedAt: new Date().toISOString()
      }

      return NextResponse.json(mockAnalysis)
    }

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Error fetching analysis:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error while fetching analysis',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Store analysis result (called by the analyzer)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const analysis = await request.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    // Store the analysis (in production, save to database)
    analysisStore.set(id, analysis)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error storing analysis:', error)
    
    return NextResponse.json(
      { error: 'Internal server error while storing analysis' },
      { status: 500 }
    )
  }
}