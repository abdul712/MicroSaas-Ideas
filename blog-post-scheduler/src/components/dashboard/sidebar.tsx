'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  FileText,
  BarChart3,
  Globe,
  Users,
  Settings,
  PlusCircle,
  Home,
  Clock,
  Template
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Posts',
    href: '/dashboard/posts',
    icon: FileText,
  },
  {
    name: 'Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Integrations',
    href: '/dashboard/integrations',
    icon: Globe,
  },
  {
    name: 'Templates',
    href: '/dashboard/templates',
    icon: Template,
  },
  {
    name: 'Team',
    href: '/dashboard/team',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-card border-r overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <Calendar className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-bold">Blog Scheduler</span>
        </div>
        
        <div className="px-4 mt-6">
          <Button className="w-full" asChild>
            <Link href="/dashboard/posts/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-shrink-0 p-4 border-t">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="ml-2 text-sm font-medium">Next Post</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Today at 2:00 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}