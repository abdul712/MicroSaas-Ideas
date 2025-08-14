import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  BarChart3, 
  Brain, 
  Shield, 
  Zap, 
  Users,
  CheckCircle,
  Star,
  TrendingUp,
  Globe
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              FeedbackFlow
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Login
            </Link>
            <Button asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            AI-Powered Feedback Collection
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Transform Customer
            <span className="text-blue-600 block">Feedback into Growth</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Collect, analyze, and act on customer feedback with our AI-powered platform. 
            Get real-time insights, sentiment analysis, and actionable recommendations to improve customer satisfaction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/register">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#demo">Watch Demo</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              GDPR compliant
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to collect and analyze feedback
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From multi-channel collection to AI-powered insights, our platform provides all the tools 
              you need to understand and improve customer experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Multi-Channel Collection</CardTitle>
                <CardDescription>
                  Collect feedback through widgets, forms, email, SMS, and integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Customizable feedback widgets</li>
                  <li>• Email survey campaigns</li>
                  <li>• Mobile-optimized forms</li>
                  <li>• API integrations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Advanced sentiment analysis and topic modeling with real-time insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Sentiment analysis</li>
                  <li>• Topic categorization</li>
                  <li>• Emotion detection</li>
                  <li>• Priority scoring</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Real-Time Analytics</CardTitle>
                <CardDescription>
                  Comprehensive dashboards with actionable insights and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Live feedback monitoring</li>
                  <li>• NPS/CSAT/CES tracking</li>
                  <li>• Custom reports</li>
                  <li>• Data visualization</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-red-600 mb-2" />
                <CardTitle>Security & Compliance</CardTitle>
                <CardDescription>
                  Enterprise-grade security with GDPR and CCPA compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• End-to-end encryption</li>
                  <li>• GDPR compliance</li>
                  <li>• Data anonymization</li>
                  <li>• Audit logging</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-yellow-600 mb-2" />
                <CardTitle>Powerful Integrations</CardTitle>
                <CardDescription>
                  Connect with your favorite tools and platforms seamlessly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Slack & Teams integration</li>
                  <li>• CRM connections</li>
                  <li>• Webhook support</li>
                  <li>• API access</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-indigo-600 mb-2" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Work together to resolve feedback and improve customer satisfaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Team workspaces</li>
                  <li>• Role-based permissions</li>
                  <li>• Comment threads</li>
                  <li>• Assignment workflows</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12">
            Trusted by businesses worldwide
          </h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500K+</div>
              <div className="text-gray-600 dark:text-gray-300">Feedback Collected</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-300">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">4.8/5</div>
              <div className="text-gray-600 dark:text-gray-300">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your customer feedback?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using FeedbackFlow to collect, analyze, and act on customer feedback.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/register">Start Your Free Trial</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-6 w-6 text-blue-400" />
                <h4 className="text-lg font-bold">FeedbackFlow</h4>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered customer feedback collection and analysis platform for modern businesses.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Product</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
                <li><Link href="/api" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Company</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Support</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 FeedbackFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}