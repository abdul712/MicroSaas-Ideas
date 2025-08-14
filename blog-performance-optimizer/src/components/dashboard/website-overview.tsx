'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Zap, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WebsiteOverviewProps {
  websiteId: string | null;
  onAnalyze: (url: string) => void;
}

export function WebsiteOverview({ websiteId, onAnalyze }: WebsiteOverviewProps) {
  const [website, setWebsite] = useState<any>(null);
  const [latestData, setLatestData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (websiteId) {
      loadWebsiteData();
    }
  }, [websiteId]);

  const loadWebsiteData = async () => {
    if (!websiteId) return;

    setLoading(true);
    try {
      const [websiteResponse, analysisResponse] = await Promise.all([
        fetch(`/api/websites?id=${websiteId}`),
        fetch(`/api/analyze?websiteId=${websiteId}`)
      ]);

      if (websiteResponse.ok) {
        const websiteData = await websiteResponse.json();
        setWebsite(websiteData[0]); // Assuming single website response
      }

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setLatestData(analysisData);
      }
    } catch (error) {
      console.error('Failed to load website data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!website) return;

    setIsAnalyzing(true);
    try {
      await onAnalyze(website.url);
      // Reload data after analysis
      setTimeout(() => {
        loadWebsiteData();
      }, 2000);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getOverallHealthScore = () => {
    if (!latestData?.latest?.performance) return 0;
    
    const { performanceScore, accessibilityScore, bestPracticesScore, seoScore } = latestData.latest.performance;
    const scores = [performanceScore, accessibilityScore, bestPracticesScore, seoScore].filter(s => s > 0);
    
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
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
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!website) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select a website to view its overview</p>
        </CardContent>
      </Card>
    );
  }

  const healthScore = getOverallHealthScore();
  const lastScan = latestData?.latest?.performance?.createdAt;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{website.name}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{website.url}</span>
                <ExternalLink 
                  className="h-3 w-3 cursor-pointer hover:text-blue-600"
                  onClick={() => window.open(website.url, '_blank')}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={website.isActive ? 'success' : 'secondary'}>
              {website.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Analyze Now
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Health Score */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Overall Health Score</h3>
            <p className="text-sm text-gray-500">
              Based on performance, SEO, accessibility, and best practices
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(healthScore)}`}>
              {healthScore}
            </div>
            <Badge variant={getScoreBadgeVariant(healthScore)} className="text-xs">
              {healthScore >= 90 ? 'Excellent' : healthScore >= 70 ? 'Good' : 'Needs Work'}
            </Badge>
          </div>
        </div>

        {/* Core Metrics */}
        {latestData?.latest?.performance && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(latestData.latest.performance.performanceScore || 0)}`}>
                {latestData.latest.performance.performanceScore || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Performance</div>
              <Progress 
                value={latestData.latest.performance.performanceScore || 0} 
                className="mt-2 h-2"
              />
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(latestData.latest.performance.seoScore || 0)}`}>
                {latestData.latest.performance.seoScore || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">SEO</div>
              <Progress 
                value={latestData.latest.performance.seoScore || 0} 
                className="mt-2 h-2"
              />
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(latestData.latest.performance.accessibilityScore || 0)}`}>
                {latestData.latest.performance.accessibilityScore || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Accessibility</div>
              <Progress 
                value={latestData.latest.performance.accessibilityScore || 0} 
                className="mt-2 h-2"
              />
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(latestData.latest.performance.bestPracticesScore || 0)}`}>
                {latestData.latest.performance.bestPracticesScore || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Best Practices</div>
              <Progress 
                value={latestData.latest.performance.bestPracticesScore || 0} 
                className="mt-2 h-2"
              />
            </div>
          </div>
        )}

        {/* Core Web Vitals */}
        {latestData?.latest?.performance && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Core Web Vitals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div>
                  <div className="text-sm font-medium">LCP</div>
                  <div className="text-xs text-gray-500">Largest Contentful Paint</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {latestData.latest.performance.lcp ? 
                      `${(latestData.latest.performance.lcp / 1000).toFixed(1)}s` : 'N/A'}
                  </div>
                  {latestData.latest.performance.lcp <= 2500 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 inline" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 inline" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div>
                  <div className="text-sm font-medium">FID</div>
                  <div className="text-xs text-gray-500">First Input Delay</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {latestData.latest.performance.fid ? 
                      `${latestData.latest.performance.fid.toFixed(0)}ms` : 'N/A'}
                  </div>
                  {latestData.latest.performance.fid <= 100 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 inline" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 inline" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div>
                  <div className="text-sm font-medium">CLS</div>
                  <div className="text-xs text-gray-500">Cumulative Layout Shift</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {latestData.latest.performance.cls ? 
                      latestData.latest.performance.cls.toFixed(3) : 'N/A'}
                  </div>
                  {latestData.latest.performance.cls <= 0.1 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 inline" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 inline" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Scan Info */}
        {lastScan && (
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>
                Last analyzed {formatDistanceToNow(new Date(lastScan), { addSuffix: true })}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={loadWebsiteData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* No Data State */}
        {!latestData?.latest?.performance && !loading && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No Analysis Data</h3>
            <p className="text-gray-500 mb-4">
              Run your first analysis to see performance metrics and optimization opportunities.
            </p>
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}