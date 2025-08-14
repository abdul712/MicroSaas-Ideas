import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  BarChart3, 
  Users, 
  Target, 
  Brain, 
  Zap, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Globe,
  TrendingUp,
  Database,
  Smartphone
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                SegmentAI
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Features</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Pricing</a>
              <a href="#integrations" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Integrations</a>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6" variant="secondary">
            🚀 Now with Real-time ML Segmentation
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            AI-Powered Customer
            <span className="text-primary block mt-2">Segmentation</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform your marketing with intelligent customer segmentation. Increase revenue by 35% 
            through precision targeting and personalized experiences powered by machine learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/auth/register">
              <Button size="lg" className="px-8 py-3 text-lg">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
                Watch Demo
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>GDPR compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary/5 dark:bg-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">1M+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Customers Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">35%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Revenue Increase</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">90%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Segmentation Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">15+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Platform Integrations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Powerful Features for Modern Marketers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to understand your customers, create targeted segments, 
              and drive personalized marketing campaigns at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="segment-card">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>AI-Powered Segmentation</CardTitle>
                <CardDescription>
                  Advanced machine learning algorithms automatically identify customer patterns 
                  and create high-value segments using K-means, DBSCAN, and behavioral clustering.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="segment-card">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Real-time Updates</CardTitle>
                <CardDescription>
                  Customer segments update automatically as new data arrives. 
                  Get instant insights with real-time processing and live dashboard updates.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="segment-card">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Interactive dashboards with RFM analysis, customer journey mapping, 
                  churn prediction, and lifetime value forecasting.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="segment-card">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Multi-Source Integration</CardTitle>
                <CardDescription>
                  Connect Shopify, Stripe, Mailchimp, HubSpot, Salesforce, and 10+ other platforms. 
                  Unified customer data from all touchpoints.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="segment-card">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  GDPR & CCPA compliant with end-to-end encryption, audit logging, 
                  and role-based access controls for enterprise peace of mind.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="segment-card">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle>Marketing Automation</CardTitle>
                <CardDescription>
                  Trigger campaigns automatically based on segment membership. 
                  Export to marketing platforms or use webhooks for custom workflows.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect Your Data</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Integrate with your e-commerce platform, CRM, or upload customer data directly. 
                Our connectors work with 15+ popular platforms.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Creates Segments</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our machine learning algorithms analyze your customer data and automatically 
                create meaningful segments based on behavior, value, and preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Launch Campaigns</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Export segments to your marketing tools or use our webhook system 
                to trigger personalized campaigns and increase conversion rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Preview */}
      <section id="integrations" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Connect Your Favorite Tools
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Seamlessly integrate with the platforms you already use
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center justify-items-center opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
          </div>

          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Shopify • Stripe • Mailchimp • HubSpot • Salesforce • Google Analytics • Klaviyo • Zendesk • and more
          </p>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900/50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Choose the plan that fits your business size and needs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="segment-card">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-3xl font-bold">$99<span className="text-sm font-normal">/month</span></div>
                <CardDescription>Perfect for small businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Up to 10K customers</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> 5 segments</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Basic analytics</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Email support</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="segment-card border-primary">
              <CardHeader>
                <Badge className="w-fit mx-auto mb-2">Most Popular</Badge>
                <CardTitle>Professional</CardTitle>
                <div className="text-3xl font-bold">$299<span className="text-sm font-normal">/month</span></div>
                <CardDescription>For growing marketing teams</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Up to 50K customers</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Unlimited segments</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> ML segmentation</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Real-time updates</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Priority support</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="segment-card">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="text-3xl font-bold">$799<span className="text-sm font-normal">/month</span></div>
                <CardDescription>For large organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Up to 250K customers</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Predictive analytics</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Custom models</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> White-label options</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Phone support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of businesses using AI-powered segmentation to increase revenue and customer satisfaction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="px-8 py-3 text-lg">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">SegmentAI</span>
              </div>
              <p className="text-sm">
                AI-powered customer segmentation platform helping businesses create targeted marketing campaigns.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
                <li><a href="#" className="hover:text-white">API Docs</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; 2024 SegmentAI. All rights reserved. Built with enterprise-grade security and GDPR compliance.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}