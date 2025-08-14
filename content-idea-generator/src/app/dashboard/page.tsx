'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Lightbulb,
  TrendingUp,
  BookOpen,
  BarChart3,
  Plus,
  ArrowRight,
  Zap,
  Target,
  Calendar,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  const { data: session } = useSession()

  const quickActions = [
    {
      title: 'Generate New Ideas',
      description: 'Create AI-powered content ideas',
      icon: Lightbulb,
      href: '/dashboard/generate',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'View Trending Topics',
      description: 'Discover what\'s hot in your niche',
      icon: TrendingUp,
      href: '/dashboard/trends',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Manage Ideas',
      description: 'Organize your saved content ideas',
      icon: BookOpen,
      href: '/dashboard/ideas',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'View Analytics',
      description: 'Track your content performance',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ]

  const recentIdeas = [
    // Placeholder data - in real app this would come from API
    {
      id: '1',
      title: '10 Proven Strategies to Boost Your Content Engagement',
      contentType: 'blog_post',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      seoScore: 85,
      trendScore: 72
    },
    {
      id: '2',
      title: 'Why Your Content Marketing Strategy Needs AI in 2024',
      contentType: 'blog_post',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      seoScore: 91,
      trendScore: 88
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to create your next viral content idea?
          </p>
        </div>
        <Link href="/dashboard/generate">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Generate Ideas
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session?.user?.credits || 0}</div>
              <p className="text-xs text-muted-foreground">
                {session?.user?.credits && session.user.credits < 5 
                  ? 'Running low! Consider upgrading.' 
                  : 'You\'re all set!'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ideas Generated</CardTitle>
              <Lightbulb className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                +0 from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Ideas</CardTitle>
              <BookOpen className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Ready to use
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. SEO Score</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Keep optimizing!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Link href={action.href}>
                <Card className="idea-card h-full cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className={`inline-flex p-2 rounded-lg ${action.bgColor} w-fit`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                      Get started
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Ideas</CardTitle>
                <CardDescription>Your latest content ideas</CardDescription>
              </div>
              <Link href="/dashboard/ideas">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentIdeas.length > 0 ? (
                <div className="space-y-4">
                  {recentIdeas.map((idea) => (
                    <div key={idea.id} className="border-l-2 border-primary/20 pl-4">
                      <h4 className="font-medium text-sm line-clamp-2">{idea.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="capitalize">{idea.contentType.replace('_', ' ')}</span>
                        <span>SEO: {idea.seoScore}%</span>
                        <span>Trend: {idea.trendScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No ideas yet. Generate your first one!
                  </p>
                  <Link href="/dashboard/generate">
                    <Button variant="outline" size="sm" className="mt-2">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Complete these steps to optimize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Account created</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-sm text-muted-foreground">Set up your first niche</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-sm text-muted-foreground">Generate your first idea</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-sm text-muted-foreground">Explore trending topics</span>
              </div>
              <div className="pt-2">
                <Link href="/dashboard/generate">
                  <Button className="w-full">
                    Continue Setup
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Pro Tip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              For best results, start by setting up your niche and target keywords. 
              This helps our AI generate more relevant and targeted content ideas for your audience.
            </p>
            <div className="flex gap-2 mt-4">
              <Link href="/dashboard/niches">
                <Button size="sm">Set Up Niche</Button>
              </Link>
              <Link href="/dashboard/generate">
                <Button variant="outline" size="sm">Generate Ideas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}