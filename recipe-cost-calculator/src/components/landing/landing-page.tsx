'use client'

import Link from 'next/link'
import { ArrowRight, Calculator, ChefHat, TrendingUp, Users, Shield, Zap, CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LandingPage() {
  const features = [
    {
      icon: Calculator,
      title: 'Smart Cost Calculation',
      description: 'Automatically calculate recipe costs with real-time ingredient pricing and supplier integrations.'
    },
    {
      icon: ChefHat,
      title: 'Recipe Management',
      description: 'Create, organize, and scale recipes with our intuitive recipe builder and management system.'
    },
    {
      icon: TrendingUp,
      title: 'Profit Optimization',
      description: 'Optimize menu pricing with profit margin analysis and pricing recommendations.'
    },
    {
      icon: Users,
      title: 'Multi-Restaurant Support',
      description: 'Manage multiple locations with role-based access and centralized cost tracking.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with data encryption, audit trails, and compliance features.'
    },
    {
      icon: Zap,
      title: 'Real-Time Updates',
      description: 'Get instant cost updates with live ingredient pricing and inventory integration.'
    }
  ]

  const pricing = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small restaurants and cafes',
      features: [
        'Up to 500 recipes',
        'Basic cost calculation',
        'Standard reporting',
        'Email support',
        '1 restaurant location'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '$79',
      period: '/month',
      description: 'Ideal for growing food businesses',
      features: [
        'Unlimited recipes',
        'POS system integration',
        'Advanced analytics',
        'Priority support',
        'Up to 5 locations',
        'Inventory management'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: '/month',
      description: 'For large restaurant chains and franchises',
      features: [
        'Everything in Professional',
        'Custom integrations',
        'API access',
        'Dedicated account manager',
        'Unlimited locations',
        'White-label options'
      ],
      popular: false
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Restaurant Owner',
      company: 'Fusion Kitchen',
      content: 'Recipe Cost Calculator helped us increase our profit margins by 18% in just 3 months. The real-time cost tracking is a game-changer.',
      rating: 5
    },
    {
      name: 'Marcus Johnson',
      role: 'Head Chef',
      company: 'Downtown Bistro',
      content: 'Finally, a tool that makes recipe costing simple. Our pricing decisions are now data-driven and accurate.',
      rating: 5
    },
    {
      name: 'Elena Rodriguez',
      role: 'Catering Manager',
      company: 'Elite Events',
      content: 'The multi-location support and team collaboration features have streamlined our entire cost management process.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">Recipe Cost Calculator</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Testimonials
              </Link>
              <Button variant="outline" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Calculate Recipe Costs
            <span className="text-blue-600 block">Like a Pro</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Professional recipe cost management for restaurants, caterers, and food businesses. 
            Track ingredients, calculate costs, and optimize pricing with real-time data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">View Demo</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            14-day free trial • No credit card required • Cancel anytime
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Recipe Costing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive tools to calculate costs, manage ingredients, and optimize your food business profitability.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your business size. All plans include core features with 14-day free trial.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} asChild>
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Food Professionals
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See how restaurants and food businesses are saving money and increasing profits.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 dark:text-gray-300 mb-4">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Optimize Your Recipe Costs?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of food professionals who are already saving money and increasing profits.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/signup">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <div className="mt-4 text-blue-100 text-sm">
            14-day free trial • No credit card required
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ChefHat className="h-6 w-6" />
                <span className="font-bold">Recipe Cost Calculator</span>
              </div>
              <p className="text-gray-400 text-sm">
                Professional recipe cost management for the modern food industry.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><Link href="/integrations">Integrations</Link></li>
                <li><Link href="/api">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/careers">Careers</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/docs">Documentation</Link></li>
                <li><Link href="/support">Support</Link></li>
                <li><Link href="/status">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Recipe Cost Calculator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}