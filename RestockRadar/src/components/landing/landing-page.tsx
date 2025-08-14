'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Brain,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Zap,
  CheckCircle,
  ArrowRight,
  Cpu,
  Globe,
  Shield,
  Users,
  Calendar,
  PieChart,
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Demand Forecasting',
    description: 'Machine learning algorithms predict stock needs with 85%+ accuracy using sales data, seasonality, and market trends.',
  },
  {
    icon: RefreshCw,
    title: 'Automated Reordering',
    description: 'Smart replenishment system automatically generates and sends purchase orders to suppliers based on demand predictions.',
  },
  {
    icon: Globe,
    title: 'Multi-Channel Sync',
    description: 'Real-time inventory synchronization across Shopify, Amazon, eBay, and 20+ e-commerce platforms.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Comprehensive dashboards with inventory turnover, stockout prevention, and profit margin analysis.',
  },
  {
    icon: Users,
    title: 'Supplier Management',
    description: 'Track supplier performance, lead times, and reliability with automated vendor scorecards.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption, role-based access control, and audit logging.',
  },
]

const benefits = [
  { title: '30% reduction in stockouts', description: 'Never miss sales due to out-of-stock items' },
  { title: '25% inventory cost savings', description: 'Optimize stock levels and reduce carrying costs' },
  { title: '95% automation', description: 'Eliminate manual reorder processes' },
  { title: 'Sub-1 minute sync', description: 'Real-time inventory updates across all channels' },
]

const integrations = [
  { name: 'Shopify', logo: '🛒' },
  { name: 'Amazon', logo: '📦' },
  { name: 'eBay', logo: '🏪' },
  { name: 'WooCommerce', logo: '🛍️' },
  { name: 'BigCommerce', logo: '🏬' },
  { name: 'Magento', logo: '🛒' },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Operations Director',
    company: 'TechStyle Fashion',
    content: 'RestockRadar helped us reduce stockouts by 40% while cutting inventory costs by $200k annually. The AI predictions are incredibly accurate.',
    rating: 5,
  },
  {
    name: 'Marcus Rodriguez',
    role: 'CEO',
    company: 'SportGear Pro',
    content: 'The automated reordering saved our team 20 hours per week. We can now focus on growth instead of manual inventory management.',
    rating: 5,
  },
  {
    name: 'Emily Watson',
    role: 'E-commerce Manager',
    company: 'HomeDecor Plus',
    content: 'Multi-channel sync is a game-changer. Our inventory is always accurate across Amazon, Shopify, and eBay in real-time.',
    rating: 5,
  },
]

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">RestockRadar</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <Link href="#integrations" className="text-gray-600 hover:text-gray-900 transition-colors">
                Integrations
              </Link>
              <Button variant="outline" className="mr-2">
                Sign In
              </Button>
              <Button>
                Start Free Trial
              </Button>
            </div>

            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className="w-full h-0.5 bg-gray-600"></div>
                <div className="w-full h-0.5 bg-gray-600"></div>
                <div className="w-full h-0.5 bg-gray-600"></div>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Inventory Intelligence
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6">
              Never Run Out of Stock
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Again</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered inventory management that predicts demand, automates reordering, and synchronizes stock across all your sales channels in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" className="px-8 py-3 text-lg">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                Watch Demo
              </Button>
            </div>

            {/* Benefits Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {benefits.map((benefit, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-3xl font-bold text-blue-600">{benefit.title}</div>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Inventory Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to optimize inventory, reduce costs, and scale your e-commerce business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Seamless Platform Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with all major e-commerce platforms and marketplaces for unified inventory management.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {integrations.map((integration, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{integration.logo}</div>
                <h3 className="font-semibold text-gray-900">{integration.name}</h3>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Growing Businesses
            </h2>
            <p className="text-xl text-gray-600">
              See how RestockRadar helps businesses optimize their inventory and increase profits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="h-full">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-blue-600">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Inventory Management?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of businesses using AI to optimize inventory, reduce costs, and scale faster.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
              Start 14-Day Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-white text-white hover:bg-white hover:text-blue-600">
              Schedule Demo
            </Button>
          </div>
          
          <p className="text-sm opacity-75 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">RestockRadar</span>
              </div>
              <p className="text-gray-400">
                AI-powered inventory management for growing e-commerce businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Community</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © 2024 RestockRadar. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}