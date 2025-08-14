'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Zap, 
  Search, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  websiteId: string | null;
}

interface ActivityItem {
  id: string;
  type: 'scan' | 'alert' | 'optimization' | 'seo';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
  metadata?: any;
}

export function RecentActivity({ websiteId }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (websiteId) {
      loadRecentActivity();
    }
  }, [websiteId]);

  const loadRecentActivity = async () => {
    if (!websiteId) return;

    setLoading(true);
    try {
      // Load recent performance scans, SEO audits, and alerts
      const [scansResponse, alertsResponse] = await Promise.all([
        fetch(`/api/analyze?websiteId=${websiteId}`),
        fetch(`/api/monitoring?websiteId=${websiteId}`)
      ]);

      const activities: ActivityItem[] = [];

      // Add performance scans
      if (scansResponse.ok) {
        const scanData = await scansResponse.json();
        if (scanData.history?.performance) {
          scanData.history.performance.slice(0, 5).forEach((scan: any) => {
            activities.push({
              id: `scan-${scan.id}`,
              type: 'scan',
              title: 'Performance Analysis Completed',
              description: `Performance score: ${scan.performanceScore || 0}`,
              timestamp: new Date(scan.createdAt),
              status: (scan.performanceScore || 0) >= 70 ? 'success' : 'warning',
              metadata: scan
            });
          });
        }
      }

      // Add alerts
      if (alertsResponse.ok) {
        const alertData = await alertsResponse.json();
        alertData.slice(0, 5).forEach((alert: any) => {
          activities.push({
            id: `alert-${alert.id}`,
            type: 'alert',
            title: alert.title,
            description: alert.message,
            timestamp: new Date(alert.createdAt),
            status: alert.severity === 'critical' ? 'error' : 
                   alert.severity === 'high' ? 'warning' : 'info',
            metadata: alert
          });
        });
      }

      // Sort by timestamp and take latest 10
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(activities.slice(0, 10));

    } catch (error) {
      console.error('Failed to load recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case 'scan':
        return status === 'success' ? 
          <CheckCircle className="h-4 w-4 text-green-600" /> :
          <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'seo':
        return <Search className="h-4 w-4 text-blue-600" />;
      case 'alert':
        return status === 'error' ? 
          <AlertTriangle className="h-4 w-4 text-red-600" /> :
          <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'optimization':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success" className="text-xs">Success</Badge>;
      case 'warning':
        return <Badge variant="warning" className="text-xs">Warning</Badge>;
      case 'error':
        return <Badge variant="error" className="text-xs">Error</Badge>;
      case 'info':
        return <Badge variant="secondary" className="text-xs">Info</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No recent activity</p>
            <p className="text-gray-400 text-xs">
              Activity will appear here after running analyses
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </h4>
                    {getStatusBadge(activity.status)}
                  </div>
                  <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                    {activity.metadata && activity.type === 'scan' && (
                      <div className="flex items-center space-x-2 text-xs">
                        {activity.metadata.performanceScore && (
                          <div className="flex items-center space-x-1">
                            <Zap className="h-3 w-3" />
                            <span>{activity.metadata.performanceScore}</span>
                          </div>
                        )}
                        {activity.metadata.seoScore && (
                          <div className="flex items-center space-x-1">
                            <Search className="h-3 w-3" />
                            <span>{activity.metadata.seoScore}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {activities.length === 10 && (
              <div className="text-center pt-2">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View all activity
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}