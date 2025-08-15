'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Smartphone, Monitor, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface PerformanceMetricsProps {
  websiteId: string | null;
}

export function PerformanceMetrics({ websiteId }: PerformanceMetricsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    if (websiteId) {
      loadPerformanceData();
    }
  }, [websiteId]);

  const loadPerformanceData = async () => {
    if (!websiteId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/analyze?websiteId=${websiteId}`);
      if (response.ok) {
        const analysisData = await response.json();
        setData(analysisData);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricStatus = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (value <= thresholds.poor) return { status: 'needs-improvement', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'poor', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const formatMetricValue = (value: number | null, type: 'time' | 'score' | 'decimal') => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (type) {
      case 'time':
        return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
      case 'score':
        return Math.round(value).toString();
      case 'decimal':
        return value.toFixed(3);
      default:
        return value.toString();
    }
  };

  const createTrendData = (history: any[]) => {
    return history.slice(-7).map((scan, index) => ({
      date: new Date(scan.createdAt).toLocaleDateString(),
      performance: scan.performanceScore || 0,
      lcp: scan.lcp ? scan.lcp / 1000 : 0,
      cls: scan.cls || 0,
      fcp: scan.fcp ? scan.fcp / 1000 : 0
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.latest?.performance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No performance data available</p>
            <p className="text-sm text-gray-400">Run an analysis to see metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latest = data.latest.performance;
  const history = data.history?.performance || [];
  const trendData = createTrendData(history);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Metrics</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={selectedDevice === 'desktop' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedDevice('desktop')}
            >
              <Monitor className="h-3 w-3 mr-1" />
              Desktop
            </Badge>
            <Badge 
              variant={selectedDevice === 'mobile' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedDevice('mobile')}
            >
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {latest.performanceScore || 0}
                </div>
                <div className="text-sm text-gray-500">Performance Score</div>
                <div className="flex items-center justify-center mt-2">
                  {latest.performanceScore >= 90 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatMetricValue(latest.fcp, 'time')}
                </div>
                <div className="text-sm text-gray-500">First Contentful Paint</div>
                <div className="flex items-center justify-center mt-2">
                  {(latest.fcp || 0) <= 1800 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatMetricValue(latest.speedIndex, 'time')}
                </div>
                <div className="text-sm text-gray-500">Speed Index</div>
                <div className="flex items-center justify-center mt-2">
                  {(latest.speedIndex || 0) <= 3400 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatMetricValue(latest.totalBlockingTime, 'time')}
                </div>
                <div className="text-sm text-gray-500">Total Blocking Time</div>
                <div className="flex items-center justify-center mt-2">
                  {(latest.totalBlockingTime || 0) <= 200 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-4">
            <div className="space-y-4">
              {/* LCP */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">Largest Contentful Paint (LCP)</h4>
                  <p className="text-sm text-gray-500">Measures loading performance</p>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${getMetricStatus(latest.lcp || 0, { good: 2500, poor: 4000 }).color}`}>
                    {formatMetricValue(latest.lcp, 'time')}
                  </div>
                  <Badge variant={
                    (latest.lcp || 0) <= 2500 ? 'success' : 
                    (latest.lcp || 0) <= 4000 ? 'warning' : 'error'
                  }>
                    {(latest.lcp || 0) <= 2500 ? 'Good' : 
                     (latest.lcp || 0) <= 4000 ? 'Needs Improvement' : 'Poor'}
                  </Badge>
                </div>
              </div>

              {/* FID */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">First Input Delay (FID)</h4>
                  <p className="text-sm text-gray-500">Measures interactivity</p>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${getMetricStatus(latest.fid || 0, { good: 100, poor: 300 }).color}`}>
                    {formatMetricValue(latest.fid, 'time')}
                  </div>
                  <Badge variant={
                    (latest.fid || 0) <= 100 ? 'success' : 
                    (latest.fid || 0) <= 300 ? 'warning' : 'error'
                  }>
                    {(latest.fid || 0) <= 100 ? 'Good' : 
                     (latest.fid || 0) <= 300 ? 'Needs Improvement' : 'Poor'}
                  </Badge>
                </div>
              </div>

              {/* CLS */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">Cumulative Layout Shift (CLS)</h4>
                  <p className="text-sm text-gray-500">Measures visual stability</p>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${getMetricStatus(latest.cls || 0, { good: 0.1, poor: 0.25 }).color}`}>
                    {formatMetricValue(latest.cls, 'decimal')}
                  </div>
                  <Badge variant={
                    (latest.cls || 0) <= 0.1 ? 'success' : 
                    (latest.cls || 0) <= 0.25 ? 'warning' : 'error'
                  }>
                    {(latest.cls || 0) <= 0.1 ? 'Good' : 
                     (latest.cls || 0) <= 0.25 ? 'Needs Improvement' : 'Poor'}
                  </Badge>
                </div>
              </div>

              {/* TTFB */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">Time to First Byte (TTFB)</h4>
                  <p className="text-sm text-gray-500">Measures server responsiveness</p>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${getMetricStatus(latest.ttfb || 0, { good: 800, poor: 1800 }).color}`}>
                    {formatMetricValue(latest.ttfb, 'time')}
                  </div>
                  <Badge variant={
                    (latest.ttfb || 0) <= 800 ? 'success' : 
                    (latest.ttfb || 0) <= 1800 ? 'warning' : 'error'
                  }>
                    {(latest.ttfb || 0) <= 800 ? 'Good' : 
                     (latest.ttfb || 0) <= 1800 ? 'Needs Improvement' : 'Poor'}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {trendData.length > 1 ? (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Performance Score Trend</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="performance" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Core Web Vitals Trend</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'cls' ? value : `${value}s`,
                          name.toUpperCase()
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lcp" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="LCP"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="fcp" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        name="FCP"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cls" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        name="CLS"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Not enough data for trends</p>
                <p className="text-sm text-gray-400">Run more analyses to see performance trends</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}