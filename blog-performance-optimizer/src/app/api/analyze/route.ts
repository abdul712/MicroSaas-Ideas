import { NextRequest, NextResponse } from 'next/server';
import { PerformanceAnalyzer } from '@/lib/performance-analyzer';
import { SEOAnalyzer } from '@/lib/seo-analyzer';
import { prisma } from '@/lib/prisma';
import { validateUrl, normalizeUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, websiteId, analysisType = 'full' } = body;

    // Validate input
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!validateUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeUrl(url);

    // Get or create website record
    let website;
    if (websiteId) {
      website = await prisma.website.findUnique({
        where: { id: websiteId }
      });
    } else {
      // Create a temporary website record for analysis
      website = await prisma.website.create({
        data: {
          url: normalizedUrl,
          name: new URL(normalizedUrl).hostname,
          projectId: 'temp', // Would need proper project management
          userId: 'temp' // Would need proper auth
        }
      });
    }

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    const results: any = {
      websiteId: website.id,
      url: normalizedUrl,
      timestamp: new Date().toISOString()
    };

    // Perform performance analysis
    if (analysisType === 'full' || analysisType === 'performance') {
      try {
        const performanceAnalyzer = PerformanceAnalyzer.getInstance();
        
        // Analyze for both mobile and desktop
        const [mobileResults, desktopResults] = await Promise.allSettled([
          performanceAnalyzer.analyzeWebsite(website.id, normalizedUrl, 'mobile'),
          performanceAnalyzer.analyzeWebsite(website.id, normalizedUrl, 'desktop')
        ]);

        results.performance = {
          mobile: mobileResults.status === 'fulfilled' ? mobileResults.value : { error: 'Failed to analyze mobile performance' },
          desktop: desktopResults.status === 'fulfilled' ? desktopResults.value : { error: 'Failed to analyze desktop performance' }
        };

        // Get latest performance metrics
        const latestMetrics = await performanceAnalyzer.getLatestPerformanceMetrics(website.id);
        if (latestMetrics) {
          results.performance.latest = latestMetrics;
          
          // Generate optimization recommendations
          const recommendations = performanceAnalyzer.generateOptimizationRecommendations(latestMetrics);
          results.performance.recommendations = recommendations;
        }

      } catch (error) {
        console.error('Performance analysis error:', error);
        results.performance = {
          error: 'Failed to perform performance analysis',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Perform SEO analysis
    if (analysisType === 'full' || analysisType === 'seo') {
      try {
        const seoAnalyzer = SEOAnalyzer.getInstance();
        const seoResults = await seoAnalyzer.analyzeSEO(website.id, normalizedUrl);
        results.seo = seoResults;
      } catch (error) {
        console.error('SEO analysis error:', error);
        results.seo = {
          error: 'Failed to perform SEO analysis',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Update website last scan timestamp
    await prisma.website.update({
      where: { id: website.id },
      data: { lastScanAt: new Date() }
    });

    return NextResponse.json(results);

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');

    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Get latest analysis results
    const performanceAnalyzer = PerformanceAnalyzer.getInstance();
    const seoAnalyzer = SEOAnalyzer.getInstance();

    const [latestPerformance, latestSEO, performanceHistory] = await Promise.all([
      performanceAnalyzer.getLatestPerformanceMetrics(websiteId),
      seoAnalyzer.getLatestSEOAudit(websiteId),
      performanceAnalyzer.getWebsitePerformanceHistory(websiteId, 30)
    ]);

    return NextResponse.json({
      websiteId,
      latest: {
        performance: latestPerformance,
        seo: latestSEO
      },
      history: {
        performance: performanceHistory
      }
    });

  } catch (error) {
    console.error('Get analysis API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}