import puppeteer, { Browser, Page } from 'puppeteer'
import * as cheerio from 'cheerio'
import { 
  parseTitle, 
  parseMetaDescription, 
  parseMetaKeywords,
  calculateReadabilityScore,
  calculateSeoScore
} from '@/lib/utils'

export interface SeoAnalysisResult {
  id: string
  url: string
  title?: string
  metaDescription?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  overallScore?: number
  scores?: {
    technical: number
    content: number
    keywords: number
    performance: number
    meta: number
  }
  recommendations?: SeoRecommendation[]
  technicalIssues?: TechnicalIssue[]
  contentAnalysis?: ContentAnalysis
  keywordAnalysis?: KeywordAnalysis
  performanceMetrics?: PerformanceMetrics
  analyzedAt?: Date
}

export interface SeoRecommendation {
  id: string
  category: 'technical' | 'content' | 'keywords' | 'performance' | 'meta'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: number // 1-100
  effort: number // 1-100
  howToFix: string
  examples?: string[]
}

export interface TechnicalIssue {
  type: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  element?: string
  location?: string
  suggestion: string
}

export interface ContentAnalysis {
  wordCount: number
  readabilityScore: number
  headingStructure: {
    h1Count: number
    h2Count: number
    h3Count: number
    missingHeadings: string[]
  }
  imageAnalysis: {
    totalImages: number
    imagesWithoutAlt: number
    largeImages: number
  }
  internalLinks: number
  externalLinks: number
  textToHtmlRatio: number
}

export interface KeywordAnalysis {
  primaryKeywords: string[]
  keywordDensity: Record<string, number>
  keywordCannibalization: boolean
  missingKeywords: string[]
  overOptimization: boolean
}

export interface PerformanceMetrics {
  loadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  mobileOptimized: boolean
  httpsEnabled: boolean
  compressionEnabled: boolean
}

export class SeoAnalyzer {
  private browser: Browser | null = null

  async analyzeUrl(url: string): Promise<SeoAnalysisResult> {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Initialize browser
      await this.initBrowser()
      
      if (!this.browser) {
        throw new Error('Failed to initialize browser')
      }

      const result: SeoAnalysisResult = {
        id: analysisId,
        url,
        status: 'IN_PROGRESS',
      }

      // Create new page
      const page = await this.browser.newPage()
      
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 })
      await page.setUserAgent('Mozilla/5.0 (compatible; SEOBot/1.0; +https://seo-checker.com/bot)')

      // Navigate to URL with timeout
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      if (!response || !response.ok()) {
        throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`)
      }

      // Get page content
      const content = await page.content()
      const $ = cheerio.load(content)

      // Parse basic meta information
      result.title = parseTitle(content)
      result.metaDescription = parseMetaDescription(content)

      // Perform comprehensive analysis
      const [
        technicalAnalysis,
        contentAnalysis,
        keywordAnalysis,
        performanceMetrics
      ] = await Promise.all([
        this.analyzeTechnicalSeo($, page),
        this.analyzeContent($, page),
        this.analyzeKeywords($, page),
        this.analyzePerformance(page)
      ])

      // Calculate scores
      const scores = {
        technical: technicalAnalysis.score,
        content: contentAnalysis.score,
        keywords: keywordAnalysis.score,
        performance: performanceMetrics.score,
        meta: this.analyzeMetaTags($).score
      }

      // Calculate overall score
      const overallScore = calculateSeoScore(scores)

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        technicalAnalysis,
        contentAnalysis,
        keywordAnalysis,
        performanceMetrics,
        scores
      })

      // Update result
      result.status = 'COMPLETED'
      result.overallScore = overallScore
      result.scores = scores
      result.recommendations = recommendations
      result.technicalIssues = technicalAnalysis.issues
      result.contentAnalysis = contentAnalysis.data
      result.keywordAnalysis = keywordAnalysis.data
      result.performanceMetrics = performanceMetrics.data
      result.analyzedAt = new Date()

      await page.close()
      
      return result

    } catch (error) {
      console.error('SEO analysis failed:', error)
      
      return {
        id: analysisId,
        url,
        status: 'FAILED',
        analyzedAt: new Date()
      }
    } finally {
      await this.closeBrowser()
    }
  }

  private async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      })
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  private async analyzeTechnicalSeo(
    $: cheerio.CheerioAPI, 
    page: Page
  ): Promise<{ score: number; issues: TechnicalIssue[] }> {
    const issues: TechnicalIssue[] = []
    let score = 100

    // Check title tag
    const title = $('title').text()
    if (!title) {
      issues.push({
        type: 'missing_title',
        severity: 'critical',
        message: 'Missing title tag',
        suggestion: 'Add a descriptive title tag to improve SEO'
      })
      score -= 20
    } else if (title.length < 10 || title.length > 60) {
      issues.push({
        type: 'title_length',
        severity: 'warning',
        message: `Title length is ${title.length} characters (recommended: 10-60)`,
        suggestion: 'Optimize title length to 10-60 characters'
      })
      score -= 10
    }

    // Check meta description
    const metaDescription = $('meta[name="description"]').attr('content')
    if (!metaDescription) {
      issues.push({
        type: 'missing_meta_description',
        severity: 'warning',
        message: 'Missing meta description',
        suggestion: 'Add a compelling meta description to improve click-through rates'
      })
      score -= 15
    } else if (metaDescription.length < 50 || metaDescription.length > 160) {
      issues.push({
        type: 'meta_description_length',
        severity: 'info',
        message: `Meta description length is ${metaDescription.length} characters (recommended: 50-160)`,
        suggestion: 'Optimize meta description length to 50-160 characters'
      })
      score -= 5
    }

    // Check heading structure
    const h1Count = $('h1').length
    if (h1Count === 0) {
      issues.push({
        type: 'missing_h1',
        severity: 'critical',
        message: 'Missing H1 tag',
        suggestion: 'Add exactly one H1 tag with your primary keyword'
      })
      score -= 15
    } else if (h1Count > 1) {
      issues.push({
        type: 'multiple_h1',
        severity: 'warning',
        message: `Multiple H1 tags found (${h1Count})`,
        suggestion: 'Use only one H1 tag per page'
      })
      score -= 10
    }

    // Check canonical URL
    const canonical = $('link[rel="canonical"]').attr('href')
    if (!canonical) {
      issues.push({
        type: 'missing_canonical',
        severity: 'warning',
        message: 'Missing canonical URL',
        suggestion: 'Add a canonical URL to prevent duplicate content issues'
      })
      score -= 10
    }

    // Check robots meta tag
    const robots = $('meta[name="robots"]').attr('content')
    if (robots && (robots.includes('noindex') || robots.includes('nofollow'))) {
      issues.push({
        type: 'robots_blocking',
        severity: 'critical',
        message: 'Page blocked by robots meta tag',
        suggestion: 'Remove noindex/nofollow directives if you want the page indexed'
      })
      score -= 25
    }

    // Check for HTTPS
    const url = await page.url()
    if (!url.startsWith('https://')) {
      issues.push({
        type: 'no_https',
        severity: 'warning',
        message: 'Page not served over HTTPS',
        suggestion: 'Enable HTTPS for better security and SEO'
      })
      score -= 10
    }

    // Check images without alt tags
    const imagesWithoutAlt = $('img:not([alt])').length
    if (imagesWithoutAlt > 0) {
      issues.push({
        type: 'images_without_alt',
        severity: 'warning',
        message: `${imagesWithoutAlt} images without alt text`,
        suggestion: 'Add descriptive alt text to all images'
      })
      score -= Math.min(20, imagesWithoutAlt * 2)
    }

    return { score: Math.max(0, score), issues }
  }

  private async analyzeContent(
    $: cheerio.CheerioAPI, 
    page: Page
  ): Promise<{ score: number; data: ContentAnalysis }> {
    let score = 100

    // Extract text content
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
    const wordCount = bodyText.split(' ').filter(word => word.length > 0).length

    // Calculate readability score
    const readabilityScore = calculateReadabilityScore(bodyText)

    // Analyze heading structure
    const headingStructure = {
      h1Count: $('h1').length,
      h2Count: $('h2').length,
      h3Count: $('h3').length,
      missingHeadings: []
    }

    if (headingStructure.h2Count === 0) {
      headingStructure.missingHeadings.push('H2')
      score -= 10
    }

    // Analyze images
    const totalImages = $('img').length
    const imagesWithoutAlt = $('img:not([alt])').length
    const imageAnalysis = {
      totalImages,
      imagesWithoutAlt,
      largeImages: 0 // Would need actual size analysis
    }

    // Count links
    const internalLinks = $('a[href^="/"], a[href*="' + await page.url() + '"]').length
    const externalLinks = $('a[href^="http"]:not([href*="' + await page.url() + '"])').length

    // Calculate text to HTML ratio
    const htmlContent = $.html()
    const textToHtmlRatio = (bodyText.length / htmlContent.length) * 100

    // Scoring based on content quality
    if (wordCount < 300) {
      score -= 20
    } else if (wordCount > 2000) {
      score += 10
    }

    if (readabilityScore < 60) {
      score -= 15
    }

    if (textToHtmlRatio < 15) {
      score -= 10
    }

    const data: ContentAnalysis = {
      wordCount,
      readabilityScore,
      headingStructure,
      imageAnalysis,
      internalLinks,
      externalLinks,
      textToHtmlRatio
    }

    return { score: Math.max(0, score), data }
  }

  private async analyzeKeywords(
    $: cheerio.CheerioAPI, 
    page: Page
  ): Promise<{ score: number; data: KeywordAnalysis }> {
    let score = 100

    const bodyText = $('body').text().toLowerCase()
    const title = $('title').text().toLowerCase()
    const metaDescription = $('meta[name="description"]').attr('content')?.toLowerCase() || ''

    // Simple keyword extraction (in a real implementation, you'd use more sophisticated NLP)
    const words = bodyText.match(/\b\w{3,}\b/g) || []
    const wordCounts = words.reduce((acc: Record<string, number>, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {})

    // Calculate keyword density
    const totalWords = words.length
    const keywordDensity: Record<string, number> = {}
    
    Object.entries(wordCounts).forEach(([word, count]) => {
      const density = (count / totalWords) * 100
      if (density > 0.5) { // Only include words with >0.5% density
        keywordDensity[word] = density
      }
    })

    // Find primary keywords (most frequent with good density)
    const primaryKeywords = Object.entries(keywordDensity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)

    // Check for over-optimization
    const overOptimization = Object.values(keywordDensity).some(density => density > 5)
    if (overOptimization) {
      score -= 20
    }

    // Check if primary keyword appears in title and meta description
    if (primaryKeywords.length > 0) {
      const primaryKeyword = primaryKeywords[0]
      if (!title.includes(primaryKeyword)) {
        score -= 15
      }
      if (!metaDescription.includes(primaryKeyword)) {
        score -= 10
      }
    }

    const data: KeywordAnalysis = {
      primaryKeywords,
      keywordDensity,
      keywordCannibalization: false, // Would need site-wide analysis
      missingKeywords: [], // Would need keyword research
      overOptimization
    }

    return { score: Math.max(0, score), data }
  }

  private async analyzePerformance(page: Page): Promise<{ score: number; data: PerformanceMetrics }> {
    let score = 100

    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstByte: navigation.responseStart - navigation.fetchStart,
      }
    })

    // Check HTTPS
    const url = await page.url()
    const httpsEnabled = url.startsWith('https://')
    if (!httpsEnabled) {
      score -= 15
    }

    // Mock Core Web Vitals (in production, you'd use real measurements)
    const data: PerformanceMetrics = {
      loadTime: performanceMetrics.loadTime,
      firstContentfulPaint: performanceMetrics.domContentLoaded,
      largestContentfulPaint: performanceMetrics.loadTime * 0.8,
      cumulativeLayoutShift: 0.1, // Mock value
      firstInputDelay: 50, // Mock value
      mobileOptimized: true, // Would need actual mobile testing
      httpsEnabled,
      compressionEnabled: true // Would need actual header analysis
    }

    // Score based on performance
    if (data.loadTime > 3000) {
      score -= 20
    } else if (data.loadTime > 2000) {
      score -= 10
    }

    if (data.largestContentfulPaint > 2500) {
      score -= 15
    }

    if (data.cumulativeLayoutShift > 0.1) {
      score -= 10
    }

    return { score: Math.max(0, score), data }
  }

  private analyzeMetaTags($: cheerio.CheerioAPI): { score: number } {
    let score = 100

    // Check Open Graph tags
    const ogTitle = $('meta[property="og:title"]').attr('content')
    const ogDescription = $('meta[property="og:description"]').attr('content')
    const ogImage = $('meta[property="og:image"]').attr('content')

    if (!ogTitle) score -= 10
    if (!ogDescription) score -= 10
    if (!ogImage) score -= 5

    // Check Twitter Card tags
    const twitterCard = $('meta[name="twitter:card"]').attr('content')
    if (!twitterCard) score -= 5

    // Check viewport meta tag
    const viewport = $('meta[name="viewport"]').attr('content')
    if (!viewport) score -= 15

    return { score: Math.max(0, score) }
  }

  private generateRecommendations(analysisData: any): SeoRecommendation[] {
    const recommendations: SeoRecommendation[] = []

    // Add recommendations based on analysis
    if (analysisData.scores.technical < 80) {
      recommendations.push({
        id: 'improve_technical_seo',
        category: 'technical',
        priority: 'high',
        title: 'Fix Technical SEO Issues',
        description: 'Address critical technical SEO problems affecting your site\'s indexability.',
        impact: 85,
        effort: 60,
        howToFix: 'Review and fix missing title tags, meta descriptions, heading structure, and ensure HTTPS is enabled.',
        examples: ['Add missing title tags', 'Fix heading hierarchy', 'Enable HTTPS']
      })
    }

    if (analysisData.contentAnalysis.data.wordCount < 300) {
      recommendations.push({
        id: 'increase_content_length',
        category: 'content',
        priority: 'medium',
        title: 'Increase Content Length',
        description: 'Your content is too short. Longer content typically performs better in search results.',
        impact: 70,
        effort: 40,
        howToFix: 'Expand your content to at least 300 words with valuable, relevant information.',
        examples: ['Add more detailed explanations', 'Include examples', 'Add related subtopics']
      })
    }

    if (analysisData.scores.performance < 75) {
      recommendations.push({
        id: 'improve_page_speed',
        category: 'performance',
        priority: 'high',
        title: 'Improve Page Loading Speed',
        description: 'Slow loading pages hurt both user experience and search rankings.',
        impact: 90,
        effort: 70,
        howToFix: 'Optimize images, enable compression, minimize CSS/JS, and use a CDN.',
        examples: ['Compress images', 'Enable gzip compression', 'Minimize HTTP requests']
      })
    }

    return recommendations
  }
}