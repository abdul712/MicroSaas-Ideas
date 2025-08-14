import lighthouse from 'lighthouse';
import { launch } from 'puppeteer';
import { prisma } from './prisma';

interface LighthouseResult {
  lhr: {
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      'best-practices': { score: number };
      seo: { score: number };
    };
    audits: {
      'largest-contentful-paint': { numericValue: number };
      'first-input-delay': { numericValue?: number };
      'cumulative-layout-shift': { numericValue: number };
      'first-contentful-paint': { numericValue: number };
      'server-response-time': { numericValue: number };
      'speed-index': { numericValue: number };
      'total-blocking-time': { numericValue: number };
      'total-byte-weight': { numericValue: number };
    };
  };
}

export class PerformanceAnalyzer {
  private static instance: PerformanceAnalyzer;

  public static getInstance(): PerformanceAnalyzer {
    if (!PerformanceAnalyzer.instance) {
      PerformanceAnalyzer.instance = new PerformanceAnalyzer();
    }
    return PerformanceAnalyzer.instance;
  }

  async analyzeWebsite(websiteId: string, url: string, device: 'mobile' | 'desktop' = 'desktop') {
    const scanId = await this.createPerformanceScan(websiteId, url, device);
    
    try {
      await this.updateScanStatus(scanId, 'running');
      
      // Launch Puppeteer browser
      const browser = await launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // Configure Lighthouse options
      const options = {
        logLevel: 'info' as const,
        output: 'json' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: (browser as any).wsEndpoint().split(':')[2].split('/')[0],
        formFactor: device,
        screenEmulation: device === 'mobile' ? {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
        } : {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
        }
      };

      // Run Lighthouse analysis
      const result = await lighthouse(url, options) as LighthouseResult;
      await browser.close();

      // Extract metrics
      const metrics = this.extractMetrics(result);
      
      // Store results
      await this.storeResults(scanId, metrics, result.lhr);
      await this.updateScanStatus(scanId, 'completed');

      return {
        scanId,
        success: true,
        metrics
      };

    } catch (error) {
      await this.updateScanStatus(scanId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async createPerformanceScan(websiteId: string, url: string, device: string) {
    const scan = await prisma.performanceScan.create({
      data: {
        websiteId,
        url,
        device,
        scanStatus: 'pending'
      }
    });
    return scan.id;
  }

  private async updateScanStatus(scanId: string, status: string, errorMessage?: string) {
    await prisma.performanceScan.update({
      where: { id: scanId },
      data: {
        scanStatus: status,
        errorMessage,
        updatedAt: new Date()
      }
    });
  }

  private extractMetrics(result: LighthouseResult) {
    const { categories, audits } = result.lhr;

    return {
      // Lighthouse scores (0-100)
      performanceScore: Math.round((categories.performance?.score || 0) * 100),
      accessibilityScore: Math.round((categories.accessibility?.score || 0) * 100),
      bestPracticesScore: Math.round((categories['best-practices']?.score || 0) * 100),
      seoScore: Math.round((categories.seo?.score || 0) * 100),

      // Core Web Vitals
      lcp: audits['largest-contentful-paint']?.numericValue || null,
      fid: audits['first-input-delay']?.numericValue || null,
      cls: audits['cumulative-layout-shift']?.numericValue || null,
      fcp: audits['first-contentful-paint']?.numericValue || null,
      ttfb: audits['server-response-time']?.numericValue || null,

      // Additional metrics
      speedIndex: audits['speed-index']?.numericValue || null,
      totalBlockingTime: audits['total-blocking-time']?.numericValue || null,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || null,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || null,

      // Resource metrics
      totalBytes: audits['total-byte-weight']?.numericValue || null
    };
  }

  private async storeResults(scanId: string, metrics: any, rawData: any) {
    const endTime = Date.now();
    
    await prisma.performanceScan.update({
      where: { id: scanId },
      data: {
        ...metrics,
        rawData: rawData as any,
        scanDuration: 30000, // Approximate scan duration
        updatedAt: new Date()
      }
    });

    // Store time-series metrics for trending
    const websiteScan = await prisma.performanceScan.findUnique({
      where: { id: scanId },
      select: { websiteId: true, device: true, url: true }
    });

    if (websiteScan) {
      const metricsToStore = [
        { type: 'lcp', value: metrics.lcp },
        { type: 'fid', value: metrics.fid },
        { type: 'cls', value: metrics.cls },
        { type: 'fcp', value: metrics.fcp },
        { type: 'ttfb', value: metrics.ttfb },
        { type: 'speed_index', value: metrics.speedIndex }
      ];

      for (const metric of metricsToStore) {
        if (metric.value !== null) {
          await prisma.performanceMetric.create({
            data: {
              websiteId: websiteScan.websiteId,
              metricType: metric.type,
              value: metric.value,
              device: websiteScan.device,
              url: websiteScan.url
            }
          });
        }
      }
    }
  }

  async getWebsitePerformanceHistory(websiteId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const scans = await prisma.performanceScan.findMany({
      where: {
        websiteId,
        createdAt: {
          gte: since
        },
        scanStatus: 'completed'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    return scans;
  }

  async getLatestPerformanceMetrics(websiteId: string) {
    const latest = await prisma.performanceScan.findFirst({
      where: {
        websiteId,
        scanStatus: 'completed'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return latest;
  }

  async analyzeMultipleUrls(websiteId: string, urls: string[]) {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await this.analyzeWebsite(websiteId, url);
        results.push(result);
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  generateOptimizationRecommendations(metrics: any) {
    const recommendations = [];

    // LCP recommendations
    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push({
        type: 'image',
        priority: 'high',
        title: 'Optimize Largest Contentful Paint',
        description: 'Your LCP is slower than recommended. Consider optimizing images, using a CDN, or improving server response times.',
        estimatedImprovement: 25
      });
    }

    // FID recommendations
    if (metrics.fid && metrics.fid > 100) {
      recommendations.push({
        type: 'js',
        priority: 'high',
        title: 'Reduce First Input Delay',
        description: 'Break up long tasks, optimize JavaScript execution, and use web workers for heavy computations.',
        estimatedImprovement: 30
      });
    }

    // CLS recommendations
    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push({
        type: 'css',
        priority: 'medium',
        title: 'Improve Cumulative Layout Shift',
        description: 'Add size attributes to images and videos, reserve space for dynamic content.',
        estimatedImprovement: 20
      });
    }

    // Performance score recommendations
    if (metrics.performanceScore < 70) {
      recommendations.push({
        type: 'caching',
        priority: 'high',
        title: 'Implement Better Caching',
        description: 'Use browser caching, CDN, and optimize cache headers to improve loading speeds.',
        estimatedImprovement: 35
      });
    }

    return recommendations;
  }
}