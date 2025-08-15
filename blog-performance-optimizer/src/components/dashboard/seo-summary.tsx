'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Image,
  Link,
  FileText,
  Smartphone
} from 'lucide-react';

interface SEOSummaryProps {
  websiteId: string | null;
}

export function SEOSummary({ websiteId }: SEOSummaryProps) {
  const [seoData, setSeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (websiteId) {
      loadSEOData();
    }
  }, [websiteId]);

  const loadSEOData = async () => {
    if (!websiteId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/analyze?websiteId=${websiteId}`);
      if (response.ok) {
        const data = await response.json();
        setSeoData(data.latest?.seo);
      }
    } catch (error) {
      console.error('Failed to load SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SEO Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!seoData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SEO Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No SEO data available</p>
            <p className="text-sm text-gray-400">Run an analysis to see SEO metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const issues = seoData.issues || [];
  const suggestions = seoData.suggestions || [];
  const criticalIssues = issues.filter((issue: any) => issue.type === 'error');
  const warnings = issues.filter((issue: any) => issue.type === 'warning');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>SEO Summary</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall SEO Score */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">SEO Score</h3>
            <p className="text-sm text-gray-500">Overall SEO optimization level</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(seoData.auditScore || 0)}`}>
              {seoData.auditScore || 0}
            </div>
            <Badge variant={getScoreBadgeVariant(seoData.auditScore || 0)} className="text-xs">
              {(seoData.auditScore || 0) >= 90 ? 'Excellent' : 
               (seoData.auditScore || 0) >= 70 ? 'Good' : 'Needs Work'}
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {seoData.hasMetaDesc ? '✓' : '✗'}
            </div>
            <div className="text-xs text-gray-500">Meta Description</div>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {seoData.hasH1 ? '✓' : '✗'}
            </div>
            <div className="text-xs text-gray-500">H1 Tag</div>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {seoData.mobileOptimized ? '✓' : '✗'}
            </div>
            <div className="text-xs text-gray-500">Mobile Friendly</div>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-bold text-orange-600">
              {seoData.hasStructuredData ? '✓' : '✗'}
            </div>
            <div className="text-xs text-gray-500">Structured Data</div>
          </div>
        </div>

        {/* SEO Elements */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">SEO Elements</h4>
          
          {/* Title */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">Page Title</div>
                <div className="text-sm text-gray-500 truncate max-w-xs">
                  {seoData.title || 'No title found'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {seoData.title ? (
                <>
                  <Badge variant="outline" className="text-xs">
                    {seoData.title.length} chars
                  </Badge>
                  {seoData.title.length >= 30 && seoData.title.length <= 60 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                </>
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>

          {/* Meta Description */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">Meta Description</div>
                <div className="text-sm text-gray-500 truncate max-w-xs">
                  {seoData.description || 'No meta description found'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {seoData.description ? (
                <>
                  <Badge variant="outline" className="text-xs">
                    {seoData.metaDescLength} chars
                  </Badge>
                  {seoData.metaDescLength >= 120 && seoData.metaDescLength <= 160 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                </>
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>

          {/* Images */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Image className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">Images</div>
                <div className="text-sm text-gray-500">
                  {seoData.totalImages || 0} total, {seoData.imagesWithAlt || 0} with alt text
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {seoData.totalImages > 0 && (
                <>
                  <Progress 
                    value={seoData.totalImages > 0 ? (seoData.imagesWithAlt / seoData.totalImages) * 100 : 0}
                    className="w-16 h-2"
                  />
                  {seoData.imagesWithoutAlt === 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Link className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">Links</div>
                <div className="text-sm text-gray-500">
                  {seoData.internalLinks || 0} internal, {seoData.externalLinks || 0} external
                </div>
              </div>
            </div>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>

          {/* Mobile Optimization */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">Mobile Optimization</div>
                <div className="text-sm text-gray-500">
                  {seoData.mobileOptimized ? 'Mobile-friendly' : 'Not mobile-optimized'}
                </div>
              </div>
            </div>
            {seoData.mobileOptimized ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>

        {/* Issues and Suggestions */}
        {(criticalIssues.length > 0 || warnings.length > 0 || suggestions.length > 0) && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Issues & Recommendations</h4>
            
            {criticalIssues.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-red-600">Critical Issues</div>
                {criticalIssues.slice(0, 3).map((issue: any, index: number) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{issue.message}</p>
                  </div>
                ))}
              </div>
            )}

            {warnings.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-yellow-600">Warnings</div>
                {warnings.slice(0, 2).map((warning: any, index: number) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{warning.message}</p>
                  </div>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-blue-600">Suggestions</div>
                {suggestions.slice(0, 2).map((suggestion: any, index: number) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{suggestion.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}