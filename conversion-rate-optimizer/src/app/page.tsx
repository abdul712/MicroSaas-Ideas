'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  TrendingUp, 
  Zap, 
  Target, 
  BarChart3, 
  Users, 
  Eye,
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Globe,
  Smartphone
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real implementation, this would handle signup/waitlist
    console.log('Email submitted:', email)
    setIsLoading(false)
    setEmail('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">CRO Platform</span>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Pricing</a>
                <a href="#about" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">About</a>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Turn More Visitors Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Customers
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI-powered conversion rate optimization that automatically tests, analyzes, and implements 
              improvements to maximize your website performance and revenue.
            </p>

            <form onSubmit={handleGetStarted} className="max-w-md mx-auto mb-8">
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading} className="px-8">
                  {isLoading ? (
                    <div className="loading-spinner" />
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <p className="text-sm text-gray-500 mb-12">
              Free 14-day trial • No credit card required • Setup in 5 minutes
            </p>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">20%+</div>
                <div className="text-gray-600">Average Conversion Increase</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-gray-600">Test Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">10K+</div>
                <div className="text-gray-600">Tests Run Monthly</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for CRO Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced features designed to help you understand your visitors, test improvements, 
              and scale your conversion optimization efforts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI-Powered Testing */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AI-Powered A/B Testing</CardTitle>
                <CardDescription>
                  Automated test creation, statistical significance tracking, and winner determination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Bayesian & Frequentist analysis
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Sequential testing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Multi-variate testing
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Visual Editor */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Visual Test Builder</CardTitle>
                <CardDescription>
                  No-code editor to create variations without technical knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Drag-and-drop interface
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Real-time preview
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Element targeting
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Deep insights into user behavior and conversion patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Conversion funnels
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Heatmaps & session recordings
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    User segmentation
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Privacy Compliance */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Privacy Compliant</CardTitle>
                <CardDescription>
                  GDPR & CCPA compliant tracking with user consent management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Differential privacy
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Data anonymization
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Consent management
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Integrations */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle>Platform Integrations</CardTitle>
                <CardDescription>
                  Connect with your existing tools and e-commerce platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Shopify & WooCommerce
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Google Analytics
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Webhook APIs
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Mobile Optimization */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Mobile Optimization</CardTitle>
                <CardDescription>
                  Dedicated mobile testing and optimization features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Device-specific testing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Touch optimization
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Performance monitoring
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Growing Businesses
            </h2>
            <div className="flex justify-center items-center space-x-2 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-gray-600">4.9/5 from 500+ reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src="/api/placeholder/40/40"
                    alt="User"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <div className="font-semibold">Sarah Johnson</div>
                    <div className="text-sm text-gray-600">E-commerce Manager</div>
                  </div>
                </div>
                <p className="text-gray-700">
                  "Increased our conversion rate by 32% in just 3 months. The AI recommendations 
                  were spot-on and saved us countless hours of manual testing."
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src="/api/placeholder/40/40"
                    alt="User"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <div className="font-semibold">Mike Chen</div>
                    <div className="text-sm text-gray-600">Marketing Director</div>
                  </div>
                </div>
                <p className="text-gray-700">
                  "The visual editor made it so easy for our non-technical team to run tests. 
                  We've seen consistent improvements across all our landing pages."
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src="/api/placeholder/40/40"
                    alt="User"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <div className="font-semibold">Emily Rodriguez</div>
                    <div className="text-sm text-gray-600">Growth Lead</div>
                  </div>
                </div>
                <p className="text-gray-700">
                  "The privacy compliance features gave us peace of mind while the detailed 
                  analytics helped us understand our users better than ever before."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Optimize Your Conversions?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already maximizing their website performance
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600">
              Schedule Demo
            </Button>
          </div>

          <p className="text-blue-100 text-sm mt-6">
            No setup fees • Cancel anytime • 24/7 support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Target className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">CRO Platform</span>
              </div>
              <p className="text-gray-400">
                AI-powered conversion rate optimization for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CRO Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}