import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Search, 
  Bell, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap, 
  Globe,
  Eye,
  Brain,
  Target,
  AlertTriangle
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="px-4 py-2">
              🔍 Enterprise-Grade Competitive Intelligence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Competitor Analysis Platform
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Monitor competitors, analyze market trends, and gain strategic insights with 
              AI-powered competitive intelligence that never sleeps.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/dashboard">
                Start Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
              <Link href="/demo">
                Watch Demo
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Enterprise Security
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Real-time Monitoring
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI-Powered Insights
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Complete Competitive Intelligence Suite
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to stay ahead of the competition
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Automated Monitoring</CardTitle>
              <CardDescription>
                24/7 tracking of competitor websites, social media, pricing, and product launches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Website change detection</li>
                <li>• Social media activity tracking</li>
                <li>• Pricing and product monitoring</li>
                <li>• SEO ranking surveillance</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>AI Market Intelligence</CardTitle>
              <CardDescription>
                Advanced AI analysis for sentiment, trends, and strategic insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Sentiment analysis</li>
                <li>• Market trend prediction</li>
                <li>• Competitive gap analysis</li>
                <li>• Customer review insights</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Comprehensive visualization of competitive landscape and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Market share visualization</li>
                <li>• Performance benchmarking</li>
                <li>• Traffic analysis</li>
                <li>• Engagement comparison</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Smart Alerts</CardTitle>
              <CardDescription>
                Instant notifications for critical competitive moves and opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time threat alerts</li>
                <li>• Custom notification rules</li>
                <li>• Multi-channel delivery</li>
                <li>• Priority-based filtering</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Strategic Insights</CardTitle>
              <CardDescription>
                Actionable recommendations and opportunity identification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Market opportunity detection</li>
                <li>• Strategic recommendations</li>
                <li>• Competitive threat assessment</li>
                <li>• Growth opportunity mapping</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Share insights, collaborate on strategy, and align your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Shared dashboards</li>
                <li>• Team annotations</li>
                <li>• Role-based access</li>
                <li>• Export capabilities</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">95%</div>
              <div className="text-muted-foreground">Data Accuracy</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">&lt;1hr</div>
              <div className="text-muted-foreground">Detection Time</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
              <div className="text-muted-foreground">Competitors Tracked</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="text-center space-y-6 p-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Outmaneuver Your Competition?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of businesses using our platform to gain competitive 
              advantage through data-driven insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
                <Link href="/dashboard">
                  Start Free Trial
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Search className="w-6 h-6" />
              <span className="font-bold">Competitor Analysis Platform</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/support" className="hover:text-foreground">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}