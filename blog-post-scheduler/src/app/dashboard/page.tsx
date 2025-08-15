'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Plus,
  FileText,
  Clock,
  Users,
  BarChart3,
  Globe,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();

  const stats = [
    {
      title: 'Total Posts',
      value: '12',
      change: '+3 this week',
      icon: FileText,
      trend: 'up'
    },
    {
      title: 'Scheduled',
      value: '8',
      change: '2 today',
      icon: Clock,
      trend: 'up'
    },
    {
      title: 'Published',
      value: '45',
      change: '+12 this month',
      icon: CheckCircle,
      trend: 'up'
    },
    {
      title: 'Platforms',
      value: '5',
      change: 'Connected',
      icon: Globe,
      trend: 'neutral'
    }
  ];

  const recentPosts = [
    {
      title: 'Getting Started with Next.js 14',
      status: 'scheduled',
      platforms: ['WordPress', 'Medium'],
      scheduledFor: '2024-08-15T14:00:00',
    },
    {
      title: '10 Tips for Better React Performance',
      status: 'published',
      platforms: ['Dev.to', 'LinkedIn'],
      publishedAt: '2024-08-13T09:30:00',
    },
    {
      title: 'The Future of Web Development',
      status: 'draft',
      platforms: [],
      updatedAt: '2024-08-14T16:45:00',
    }
  ];

  const upcomingSchedule = [
    {
      time: '2:00 PM',
      title: 'Getting Started with Next.js 14',
      platform: 'WordPress'
    },
    {
      time: '4:30 PM',
      title: 'React Performance Tips',
      platform: 'Medium'
    },
    {
      time: 'Tomorrow 9:00 AM',
      title: 'Web Development Trends',
      platform: 'Dev.to'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {session?.user?.name}!</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your content today.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {stat.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Posts
            </CardTitle>
            <CardDescription>
              Your latest content activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPosts.map((post, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{post.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant={
                        post.status === 'published' ? 'default' :
                        post.status === 'scheduled' ? 'secondary' : 'outline'
                      }
                    >
                      {post.status}
                    </Badge>
                    {post.platforms.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {post.platforms.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                {post.status === 'scheduled' ? (
                  <Clock className="h-4 w-4 text-orange-500" />
                ) : post.status === 'published' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                )}
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Posts
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Schedule
            </CardTitle>
            <CardDescription>
              Your next scheduled publications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSchedule.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="bg-primary/10 p-2 rounded-md">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.time}</p>
                  <p className="text-sm text-muted-foreground truncate">{item.title}</p>
                  <Badge variant="outline" className="mt-1">
                    {item.platform}
                  </Badge>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View Full Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col">
              <Plus className="h-6 w-6 mb-2" />
              Create New Post
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Globe className="h-6 w-6 mb-2" />
              Connect Platform
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}