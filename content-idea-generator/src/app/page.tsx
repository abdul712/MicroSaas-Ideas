'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Lightbulb, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Zap, 
  Target,
  ArrowRight,
  CheckCircle,
  Star,
  Brain,
  Search,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HomePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <motion.h1 
              className="text-4xl font-bold gradient-text mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Welcome back, {session.user?.name}!
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Ready to generate your next viral content idea?
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="idea-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Generate Ideas
                  </CardTitle>
                  <CardDescription>
                    Create AI-powered content ideas tailored to your niche
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard/generate">
                    <Button className="w-full">
                      Start Generating <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="idea-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Trending Topics
                  </CardTitle>
                  <CardDescription>
                    Discover what's trending in your industry right now
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard/trends">
                    <Button variant="outline" className="w-full">
                      View Trends <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="idea-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    My Ideas
                  </CardTitle>
                  <CardDescription>
                    Manage and track your saved content ideas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard/ideas">
                    <Button variant="outline" className="w-full">
                      View Ideas <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Your content generation overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ideas Generated</span>
                    <span className="font-semibold">--</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Saved Ideas</span>
                    <span className="font-semibold">--</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Credits Remaining</span>
                    <span className="font-semibold text-green-600">
                      {session.user?.credits || 0}
                    </span>
                  </div>
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
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Create your account</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Set up your first niche</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Generate your first idea</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Explore trending topics</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold gradient-text mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Never Run Out of 
            <br />Content Ideas Again
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Generate engaging, data-driven content ideas using AI, trend analysis, and competitor research. 
            Turn content planning from hours to minutes.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Brain,
              title: "AI-Powered Generation",
              description: "Advanced AI analyzes your niche and generates personalized content ideas that resonate with your audience.",
              delay: 0.1
            },
            {
              icon: TrendingUp,
              title: "Real-Time Trend Analysis",
              description: "Stay ahead with trending topics from Google Trends, social media, and industry-specific data sources.",
              delay: 0.2
            },
            {
              icon: Target,
              title: "Audience Intelligence",
              description: "Understand what your audience wants with demographic insights and content performance predictions.",
              delay: 0.3
            },
            {
              icon: Search,
              title: "SEO Optimization",
              description: "Get keyword difficulty scores, search volume data, and SEO recommendations for every idea.",
              delay: 0.4
            },
            {
              icon: Users,
              title: "Competitor Analysis",
              description: "Identify content gaps and opportunities by analyzing what your competitors are missing.",
              delay: 0.5
            },
            {
              icon: Calendar,
              title: "Content Planning",
              description: "Organize ideas with built-in calendar integration and content scheduling features.",
              delay: 0.6
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
            >
              <Card className="idea-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Social Proof */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <p className="text-muted-foreground mb-8">Trusted by content creators worldwide</p>
          <div className="flex items-center justify-center gap-8 text-2xl font-bold text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500 fill-current" />
              <span>4.9/5</span>
            </div>
            <div>500+ Users</div>
            <div>10K+ Ideas Generated</div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of content creators who never run out of ideas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signin">
                <Button size="lg" className="w-full text-lg py-6">
                  Start Generating Ideas Now <Zap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                Free plan includes 10 AI-generated ideas. No credit card required.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}