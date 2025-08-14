'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Users,
  Target,
  BarChart3,
  Zap,
  Settings,
  Database,
  Activity,
  TrendingUp,
  Mail,
  Download,
  HelpCircle,
  Plus
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Customers',
    items: [
      {
        title: 'All Customers',
        href: '/dashboard/customers',
        icon: Users,
        badge: '12.8k',
      },
      {
        title: 'Segments',
        href: '/dashboard/segments',
        icon: Target,
        badge: '18',
      },
      {
        title: 'Journey Mapping',
        href: '/dashboard/journey',
        icon: TrendingUp,
      },
    ],
  },
  {
    title: 'AI & ML',
    items: [
      {
        title: 'ML Insights',
        href: '/dashboard/insights',
        icon: Zap,
        badge: 'New',
      },
      {
        title: 'RFM Analysis',
        href: '/dashboard/rfm',
        icon: Activity,
      },
      {
        title: 'Churn Prediction',
        href: '/dashboard/churn',
        icon: TrendingUp,
      },
    ],
  },
  {
    title: 'Campaigns',
    items: [
      {
        title: 'Email Campaigns',
        href: '/dashboard/campaigns',
        icon: Mail,
      },
      {
        title: 'Automation',
        href: '/dashboard/automation',
        icon: Zap,
      },
    ],
  },
  {
    title: 'Data',
    items: [
      {
        title: 'Integrations',
        href: '/dashboard/integrations',
        icon: Database,
        badge: '5',
      },
      {
        title: 'Data Export',
        href: '/dashboard/export',
        icon: Download,
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        title: 'General',
        href: '/dashboard/settings',
        icon: Settings,
      },
      {
        title: 'Help & Support',
        href: '/dashboard/help',
        icon: HelpCircle,
      },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        {/* Quick Actions */}
        <div className="mb-6">
          <Button className="w-full justify-start" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Segment
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-6">
          {sidebarItems.map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h4>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'sidebar-nav-item',
                        isActive && 'active'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge 
                          variant={item.badge === 'New' ? 'default' : 'secondary'} 
                          className="ml-auto text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Upgrade Notice */}
        <div className="mt-8 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Upgrade to Pro</h4>
            <p className="text-xs text-muted-foreground">
              Unlock advanced ML features and unlimited segments
            </p>
            <Button size="sm" className="w-full">
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}