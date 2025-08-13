import { redirect } from 'next/navigation'
import { getSession } from '@auth0/nextjs-auth0'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Shield, Zap, Globe, TrendingUp, Users } from 'lucide-react'

export default async function HomePage() {
  const session = await getSession()
  
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">Business Health Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/api/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/api/auth/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Your Business Fitbit
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your business vital signs
            <span className="text-blue-600"> at a glance</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Our health dashboard monitors all aspects of your business 24/7, alerting you to problems 
            before they hurt your bottom line and highlighting opportunities to grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api/auth/login">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need in one dashboard
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect all your business tools and get a unified view of your business health with 
            intelligent insights and early warning alerts.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-green-500 mb-4" />
              <CardTitle>Health Score System</CardTitle>
              <CardDescription>
                Get an overall business health score (0-100) with category breakdowns and trend indicators.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-yellow-500 mb-4" />
              <CardTitle>Smart Alerts</CardTitle>
              <CardDescription>
                Intelligent early warning system for unusual expenses, revenue dips, and cash flow issues.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-10 w-10 text-blue-500 mb-4" />
              <CardTitle>One-Click Integrations</CardTitle>
              <CardDescription>
                Connect QuickBooks, Stripe, Shopify, Google Analytics, and 20+ other business tools instantly.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-purple-500 mb-4" />
              <CardTitle>Real-time Metrics</CardTitle>
              <CardDescription>
                Monitor revenue, expenses, cash flow, customer metrics, and operational efficiency in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-indigo-500 mb-4" />
              <CardTitle>Industry Benchmarks</CardTitle>
              <CardDescription>
                Compare your performance against industry peers and get personalized improvement recommendations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-red-500 mb-4" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Bank-level encryption, SOC 2 compliance, and secure OAuth connections to protect your data.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600">
              Choose the plan that fits your business size and needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-3xl font-bold">$29<span className="text-lg text-gray-500">/month</span></div>
                <CardDescription>Perfect for small businesses getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 3 integrations</li>
                  <li>• Daily updates</li>
                  <li>• Basic health score</li>
                  <li>• Email alerts</li>
                  <li>• Mobile app access</li>
                </ul>
                <Button className="w-full mt-6">Start Free Trial</Button>
              </CardContent>
            </Card>

            <Card className="border-blue-500 border-2">
              <CardHeader>
                <Badge className="w-fit mb-2">Most Popular</Badge>
                <CardTitle>Professional</CardTitle>
                <div className="text-3xl font-bold">$79<span className="text-lg text-gray-500">/month</span></div>
                <CardDescription>For growing businesses that need more insights</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 10 integrations</li>
                  <li>• Real-time updates</li>
                  <li>• Advanced health metrics</li>
                  <li>• Custom alerts</li>
                  <li>• Team members (3)</li>
                  <li>• Priority support</li>
                </ul>
                <Button className="w-full mt-6">Start Free Trial</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business</CardTitle>
                <div className="text-3xl font-bold">$149<span className="text-lg text-gray-500">/month</span></div>
                <CardDescription>For established businesses with complex needs</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Unlimited integrations</li>
                  <li>• Predictive insights</li>
                  <li>• Custom dashboards</li>
                  <li>• API access</li>
                  <li>• Team members (10)</li>
                  <li>• Phone support</li>
                </ul>
                <Button className="w-full mt-6">Start Free Trial</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get healthy?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of businesses using our dashboard to stay on top of their performance.
          </p>
          <Link href="/api/auth/login">
            <Button size="lg">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center">
            <p className="text-gray-500 text-sm">
              © 2024 Business Health Dashboard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}