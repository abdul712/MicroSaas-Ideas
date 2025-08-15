'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Share2, BarChart3, Zap, Shield, Globe } from 'lucide-react'

export function LandingPage() {
  const features = [
    {
      icon: Calendar,
      title: 'Event Creation Wizard',
      description: 'Create professional events in minutes with our intuitive step-by-step wizard and pre-built templates.'
    },
    {
      icon: Share2,
      title: 'Multi-Platform Distribution',
      description: 'Automatically post to Facebook, Instagram, Google My Business, and 50+ local directories.'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track performance across all platforms with real-time analytics and engagement metrics.'
    },
    {
      icon: Zap,
      title: 'Marketing Automation',
      description: 'AI-powered social media content generation and optimal posting time recommendations.'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with GDPR compliance and secure payment processing.'
    },
    {
      icon: Globe,
      title: 'Local SEO Optimization',
      description: 'Boost local discovery with location-based keywords and Google Events integration.'
    }
  ]

  const pricing = [
    {
      name: 'Basic',
      price: 'Free',
      description: 'Perfect for small events',
      features: [
        '2 events per month',
        '3 social platforms',
        'Basic templates',
        '7-day analytics',
        'Email support'
      ]
    },
    {
      name: 'Local Pro',
      price: '$29',
      description: 'Ideal for regular event organizers',
      features: [
        '10 events per month',
        'All platforms',
        'Premium templates',
        '30-day analytics',
        'Local SEO tools',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Business',
      price: '$79',
      description: 'For growing businesses',
      features: [
        'Unlimited events',
        'Multi-location support',
        'Custom branding',
        'API access',
        'Advanced analytics',
        'Phone support'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">EventPro</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Pricing</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Contact</a>
            <Button variant="outline">Sign In</Button>
            <Button>Get Started</Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Promote Your Local Events
            <span className="text-blue-600"> Everywhere</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Create, promote, and manage local events with powerful automation tools. 
            Reach 10x more customers across all platforms in just 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Powerful tools designed specifically for local event promotion and community engagement.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose the plan that fits your event promotion needs. Upgrade or downgrade anytime.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricing.map((plan, index) => (
            <Card key={index} className={`border-0 shadow-lg hover:shadow-xl transition-all ${plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''}`}>
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-2 rounded-t-lg text-sm font-medium">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-4xl font-bold text-blue-600">
                  {plan.price}
                  {plan.price !== 'Free' && <span className="text-lg text-gray-500">/month</span>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <div className="h-2 w-2 bg-blue-600 rounded-full mr-3" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                  {plan.price === 'Free' ? 'Get Started' : 'Start Free Trial'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Promote Your Next Event?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of event organizers who trust EventPro to reach their local audience effectively.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
            Start Your Free Trial Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">EventPro</span>
              </div>
              <p className="text-gray-400">
                The complete solution for local event promotion and community engagement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
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
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EventPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}