'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Zap, 
  Search, 
  RefreshCw, 
  Download,
  Settings,
  BarChart3,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface QuickActionsProps {
  websiteId: string | null;
  onAnalyze: (url: string) => void;
}

export function QuickActions({ websiteId, onAnalyze }: QuickActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, url?: string) => {
    setLoading(action);
    
    try {
      switch (action) {
        case 'analyze':
          if (url) {
            await onAnalyze(url);
          }
          break;
        case 'report':
          // Generate and download report
          await generateReport();
          break;
        case 'uptime':
          // Check uptime
          await checkUptime();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setLoading(null);
    }
  };

  const generateReport = async () => {
    if (!websiteId) return;
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would generate and download a PDF report
    console.log('Report generated for website:', websiteId);
  };

  const checkUptime = async () => {
    if (!websiteId) return;
    
    try {
      // Get website details first
      const websiteResponse = await fetch(`/api/websites?id=${websiteId}`);
      if (websiteResponse.ok) {
        const websites = await websiteResponse.json();
        const website = websites[0];
        
        if (website) {
          // Perform uptime check
          const response = await fetch('/api/monitoring', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              websiteId,
              url: website.url
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Uptime check result:', result);
          }
        }
      }
    } catch (error) {
      console.error('Uptime check failed:', error);
    }
  };

  const actions = [
    {
      id: 'analyze',
      title: 'Run Full Analysis',
      description: 'Complete performance, SEO, and accessibility audit',
      icon: <Zap className="h-4 w-4" />,
      variant: 'default' as const,
      action: () => {
        // Would need to get website URL first
        handleAction('analyze', 'https://example.com');
      }
    },
    {
      id: 'seo',
      title: 'SEO Quick Scan',
      description: 'Fast SEO optimization check',
      icon: <Search className="h-4 w-4" />,
      variant: 'outline' as const,
      action: () => handleAction('seo')
    },
    {
      id: 'uptime',
      title: 'Check Uptime',
      description: 'Verify website availability',
      icon: <RefreshCw className="h-4 w-4" />,
      variant: 'outline' as const,
      action: () => handleAction('uptime')
    },
    {
      id: 'report',
      title: 'Download Report',
      description: 'Generate PDF performance report',
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      action: () => handleAction('report')
    },
    {
      id: 'settings',
      title: 'Website Settings',
      description: 'Configure monitoring and alerts',
      icon: <Settings className="h-4 w-4" />,
      variant: 'ghost' as const,
      action: () => handleAction('settings')
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Detailed performance analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      variant: 'ghost' as const,
      action: () => handleAction('analytics')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              className="w-full justify-start h-auto p-3 text-left"
              onClick={action.action}
              disabled={!websiteId || loading === action.id}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="flex-shrink-0">
                  {loading === action.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    action.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {action.description}
                  </div>
                </div>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>
            </Button>
          ))}
        </div>
        
        {!websiteId && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">
              Select a website to enable quick actions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}