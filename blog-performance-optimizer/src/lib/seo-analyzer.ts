import { Page } from 'puppeteer';
import { launch } from 'puppeteer';
import { prisma } from './prisma';

export class SEOAnalyzer {
  private static instance: SEOAnalyzer;

  public static getInstance(): SEOAnalyzer {
    if (!SEOAnalyzer.instance) {
      SEOAnalyzer.instance = new SEOAnalyzer();
    }
    return SEOAnalyzer.instance;
  }

  async analyzeSEO(websiteId: string, url: string) {
    const browser = await launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });

      const analysis = await this.performSEOAnalysis(page, url);
      
      // Store results
      await this.storeSEOResults(websiteId, url, analysis);

      return analysis;

    } finally {
      await browser.close();
    }
  }

  private async performSEOAnalysis(page: Page, url: string) {
    // Get basic page information
    const title = await page.title();
    const metaDescription = await page.$eval('meta[name="description"]', el => el.getAttribute('content')).catch(() => null);
    const metaKeywords = await page.$eval('meta[name="keywords"]', el => el.getAttribute('content')).catch(() => null);

    // Open Graph meta tags
    const ogTitle = await page.$eval('meta[property="og:title"]', el => el.getAttribute('content')).catch(() => null);
    const ogDescription = await page.$eval('meta[property="og:description"]', el => el.getAttribute('content')).catch(() => null);
    const ogImage = await page.$eval('meta[property="og:image"]', el => el.getAttribute('content')).catch(() => null);

    // Heading analysis
    const headings = await page.evaluate(() => {
      const h1Elements = Array.from(document.querySelectorAll('h1'));
      const h2Elements = Array.from(document.querySelectorAll('h2'));
      const h3Elements = Array.from(document.querySelectorAll('h3'));
      
      return {
        h1Count: h1Elements.length,
        h1Text: h1Elements.length > 0 ? h1Elements[0].textContent?.trim() : null,
        h2Count: h2Elements.length,
        h3Count: h3Elements.length,
        hasH1: h1Elements.length > 0
      };
    });

    // Image analysis
    const imageAnalysis = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const totalImages = images.length;
      const imagesWithAlt = images.filter(img => img.getAttribute('alt')).length;
      const imagesWithoutAlt = totalImages - imagesWithAlt;

      return {
        totalImages,
        imagesWithAlt,
        imagesWithoutAlt
      };
    });

    // Link analysis
    const linkAnalysis = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const currentDomain = window.location.hostname;
      
      let internalLinks = 0;
      let externalLinks = 0;

      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          if (href.startsWith('http')) {
            try {
              const linkDomain = new URL(href).hostname;
              if (linkDomain === currentDomain) {
                internalLinks++;
              } else {
                externalLinks++;
              }
            } catch (e) {
              // Invalid URL
            }
          } else if (href.startsWith('/') || !href.includes('://')) {
            internalLinks++;
          }
        }
      });

      return {
        internalLinks,
        externalLinks,
        totalLinks: links.length
      };
    });

    // Structured data analysis
    const structuredData = await page.evaluate(() => {
      const ldJsonScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const structuredDataTypes = [];
      
      ldJsonScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '');
          if (data['@type']) {
            structuredDataTypes.push(data['@type']);
          }
        } catch (e) {
          // Invalid JSON
        }
      });

      return {
        hasStructuredData: structuredDataTypes.length > 0,
        structuredDataTypes: JSON.stringify(structuredDataTypes)
      };
    });

    // Technical SEO checks
    const technicalSEO = await this.checkTechnicalSEO(page, url);

    // Mobile optimization check
    const mobileOptimized = await page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]');
      return viewport !== null;
    });

    // Calculate SEO score
    const seoScore = this.calculateSEOScore({
      title,
      metaDescription,
      headings,
      imageAnalysis,
      linkAnalysis,
      structuredData,
      technicalSEO,
      mobileOptimized
    });

    // Generate suggestions
    const suggestions = this.generateSEOSuggestions({
      title,
      metaDescription,
      headings,
      imageAnalysis,
      linkAnalysis,
      structuredData,
      technicalSEO,
      mobileOptimized
    });

    return {
      title,
      description: metaDescription,
      keywords: metaKeywords,
      ogTitle,
      ogDescription,
      ogImage,
      hasH1: headings.hasH1,
      h1Count: headings.h1Count,
      h1Text: headings.h1Text,
      hasMetaDesc: metaDescription !== null,
      metaDescLength: metaDescription?.length || 0,
      hasSitemap: technicalSEO.hasSitemap,
      hasRobotsTxt: technicalSEO.hasRobotsTxt,
      hasStructuredData: structuredData.hasStructuredData,
      structuredDataTypes: structuredData.structuredDataTypes,
      totalImages: imageAnalysis.totalImages,
      imagesWithAlt: imageAnalysis.imagesWithAlt,
      imagesWithoutAlt: imageAnalysis.imagesWithoutAlt,
      internalLinks: linkAnalysis.internalLinks,
      externalLinks: linkAnalysis.externalLinks,
      brokenLinks: 0, // Would need additional checking
      mobileOptimized,
      auditScore: seoScore,
      suggestions: suggestions,
      issues: this.identifySEOIssues({
        title,
        metaDescription,
        headings,
        imageAnalysis,
        technicalSEO,
        mobileOptimized
      })
    };
  }

  private async checkTechnicalSEO(page: Page, url: string) {
    const domain = new URL(url).origin;
    
    // Check for sitemap
    const hasSitemap = await this.checkUrlExists(`${domain}/sitemap.xml`) || 
                       await this.checkUrlExists(`${domain}/sitemap_index.xml`);
    
    // Check for robots.txt
    const hasRobotsTxt = await this.checkUrlExists(`${domain}/robots.txt`);

    return {
      hasSitemap,
      hasRobotsTxt
    };
  }

  private async checkUrlExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  private calculateSEOScore(analysis: any): number {
    let score = 0;
    let maxScore = 0;

    // Title (20 points)
    maxScore += 20;
    if (analysis.title && analysis.title.length >= 30 && analysis.title.length <= 60) {
      score += 20;
    } else if (analysis.title && analysis.title.length > 0) {
      score += 10;
    }

    // Meta description (15 points)
    maxScore += 15;
    if (analysis.metaDescription && analysis.metaDescription.length >= 120 && analysis.metaDescription.length <= 160) {
      score += 15;
    } else if (analysis.metaDescription) {
      score += 8;
    }

    // H1 tag (15 points)
    maxScore += 15;
    if (analysis.headings.hasH1 && analysis.headings.h1Count === 1) {
      score += 15;
    } else if (analysis.headings.hasH1) {
      score += 8;
    }

    // Images with alt text (10 points)
    maxScore += 10;
    if (analysis.imageAnalysis.totalImages > 0) {
      const altPercentage = analysis.imageAnalysis.imagesWithAlt / analysis.imageAnalysis.totalImages;
      score += Math.round(altPercentage * 10);
    } else {
      score += 10; // No images is fine
    }

    // Internal linking (10 points)
    maxScore += 10;
    if (analysis.linkAnalysis.internalLinks > 0) {
      score += 10;
    }

    // Technical SEO (15 points)
    maxScore += 15;
    if (analysis.technicalSEO.hasSitemap) score += 8;
    if (analysis.technicalSEO.hasRobotsTxt) score += 7;

    // Mobile optimization (10 points)
    maxScore += 10;
    if (analysis.mobileOptimized) {
      score += 10;
    }

    // Structured data (5 points)
    maxScore += 5;
    if (analysis.structuredData.hasStructuredData) {
      score += 5;
    }

    return Math.round((score / maxScore) * 100);
  }

  private generateSEOSuggestions(analysis: any) {
    const suggestions = [];

    if (!analysis.title || analysis.title.length < 30) {
      suggestions.push({
        type: 'title',
        priority: 'high',
        message: 'Add a descriptive title tag (30-60 characters)'
      });
    }

    if (!analysis.metaDescription) {
      suggestions.push({
        type: 'meta',
        priority: 'high',
        message: 'Add a meta description (120-160 characters)'
      });
    }

    if (!analysis.headings.hasH1) {
      suggestions.push({
        type: 'heading',
        priority: 'high',
        message: 'Add an H1 heading to your page'
      });
    }

    if (analysis.imageAnalysis.imagesWithoutAlt > 0) {
      suggestions.push({
        type: 'image',
        priority: 'medium',
        message: `Add alt text to ${analysis.imageAnalysis.imagesWithoutAlt} images`
      });
    }

    if (!analysis.technicalSEO.hasSitemap) {
      suggestions.push({
        type: 'technical',
        priority: 'medium',
        message: 'Create and submit an XML sitemap'
      });
    }

    if (!analysis.structuredData.hasStructuredData) {
      suggestions.push({
        type: 'structured-data',
        priority: 'low',
        message: 'Add structured data markup (JSON-LD)'
      });
    }

    return suggestions;
  }

  private identifySEOIssues(analysis: any) {
    const issues = [];

    if (analysis.headings.h1Count > 1) {
      issues.push({
        type: 'error',
        message: 'Multiple H1 tags found. Use only one H1 per page.'
      });
    }

    if (analysis.title && analysis.title.length > 60) {
      issues.push({
        type: 'warning',
        message: 'Title tag is too long and may be truncated in search results.'
      });
    }

    if (analysis.metaDescription && analysis.metaDescription.length > 160) {
      issues.push({
        type: 'warning',
        message: 'Meta description is too long and may be truncated.'
      });
    }

    if (!analysis.mobileOptimized) {
      issues.push({
        type: 'error',
        message: 'Page is not mobile-optimized. Add a viewport meta tag.'
      });
    }

    return issues;
  }

  private async storeSEOResults(websiteId: string, url: string, analysis: any) {
    await prisma.seoAudit.create({
      data: {
        websiteId,
        url,
        title: analysis.title,
        description: analysis.description,
        keywords: analysis.keywords,
        ogTitle: analysis.ogTitle,
        ogDescription: analysis.ogDescription,
        ogImage: analysis.ogImage,
        hasH1: analysis.hasH1,
        h1Count: analysis.h1Count,
        h1Text: analysis.h1Text,
        hasMetaDesc: analysis.hasMetaDesc,
        metaDescLength: analysis.metaDescLength,
        hasSitemap: analysis.hasSitemap,
        hasRobotsTxt: analysis.hasRobotsTxt,
        hasStructuredData: analysis.hasStructuredData,
        structuredDataTypes: analysis.structuredDataTypes,
        totalImages: analysis.totalImages,
        imagesWithAlt: analysis.imagesWithAlt,
        imagesWithoutAlt: analysis.imagesWithoutAlt,
        internalLinks: analysis.internalLinks,
        externalLinks: analysis.externalLinks,
        brokenLinks: analysis.brokenLinks,
        mobileOptimized: analysis.mobileOptimized,
        auditScore: analysis.auditScore,
        suggestions: analysis.suggestions as any,
        issues: analysis.issues as any
      }
    });
  }

  async getLatestSEOAudit(websiteId: string) {
    return await prisma.seoAudit.findFirst({
      where: { websiteId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSEOHistory(websiteId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return await prisma.seoAudit.findMany({
      where: {
        websiteId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}