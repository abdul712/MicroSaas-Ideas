'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { WebsiteOverview } from '@/components/dashboard/website-overview';
import { PerformanceMetrics } from '@/components/dashboard/performance-metrics';
import { SEOSummary } from '@/components/dashboard/seo-summary';
import { MonitoringAlerts } from '@/components/dashboard/monitoring-alerts';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export default function DashboardPage() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      const data = await response.json();
      setWebsites(data);
      
      if (data.length > 0 && !selectedWebsiteId) {
        setSelectedWebsiteId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWebsiteSelect = (websiteId: string) => {
    setSelectedWebsiteId(websiteId);
  };

  const handleAnalyzeWebsite = async (url: string) => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          websiteId: selectedWebsiteId,
          analysisType: 'full'
        }),
      });

      if (response.ok) {
        // Refresh data after analysis
        loadWebsites();
      }
    } catch (error) {
      console.error('Failed to analyze website:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      websites={websites}
      selectedWebsiteId={selectedWebsiteId}
      onWebsiteSelect={handleWebsiteSelect}
      onAddWebsite={loadWebsites}
    >
      <div className="space-y-6">
        {/* Website Overview */}
        <WebsiteOverview
          websiteId={selectedWebsiteId}
          onAnalyze={handleAnalyzeWebsite}
        />

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceMetrics websiteId={selectedWebsiteId} />
          <SEOSummary websiteId={selectedWebsiteId} />
        </div>

        {/* Monitoring and Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MonitoringAlerts websiteId={selectedWebsiteId} />
          </div>
          <div className="space-y-6">
            <QuickActions 
              websiteId={selectedWebsiteId}
              onAnalyze={handleAnalyzeWebsite}
            />
            <RecentActivity websiteId={selectedWebsiteId} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}