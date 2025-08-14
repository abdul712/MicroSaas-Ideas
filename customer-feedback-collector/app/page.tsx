import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Users, Zap, Shield, Globe, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold">Feedback Collector</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Customer Feedback into{' '}
            <span className="text-blue-600">Growth</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            AI-powered feedback collection platform that helps businesses gather, 
            analyze, and act on customer insights with real-time analytics and 
            intelligent categorization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6">
              <Link href="#demo">View Demo</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to collect better feedback
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From survey creation to AI-powered insights, we've got you covered
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <Sparkles className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                Automatic sentiment analysis, topic extraction, and intelligent 
                categorization of feedback responses.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <Zap className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Sub-2-second loading times for surveys and real-time analytics 
                dashboard updates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <Globe className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Multi-Channel Collection</CardTitle>
              <CardDescription>
                Collect feedback via widgets, email, SMS, QR codes, and API 
                integrations across all touchpoints.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <Users className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Role-based access control, shared dashboards, and team 
                workflow management.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <Shield className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                GDPR compliant, SOC 2 ready with encryption at rest and in 
                transit, plus comprehensive audit logs.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <BarChart className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Real-Time Analytics</CardTitle>
              <CardDescription>
                Live dashboards with NPS/CSAT tracking, trend analysis, and 
                actionable insights.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Higher Response Rates</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">&lt;2s</div>
              <div className="text-blue-100">Average Load Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500K+</div>
              <div className="text-blue-100">Responses Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to transform your customer feedback?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of businesses using our platform to make data-driven decisions
          </p>
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <Link href="/auth/signup">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BarChart className="w-6 h-6" />
                <span className="text-lg font-bold">Feedback Collector</span>
              </div>
              <p className="text-gray-400">
                AI-powered customer feedback platform for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Feedback Collector. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}