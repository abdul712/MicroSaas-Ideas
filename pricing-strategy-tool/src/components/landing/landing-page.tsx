'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Zap, 
  Shield, 
  Clock,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  DollarSign,
  LineChart,
  Sparkles,
  Globe,
  Brain
} from 'lucide-react'
import Link from 'next/link'

export function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: TrendingUp,
      title: "AI-Powered Price Optimization",
      description: "Machine learning algorithms analyze market trends, competitor pricing, and customer behavior to suggest optimal prices that maximize revenue and profit.",
      benefits: ["15-30% revenue increase", "Real-time market analysis", "Automated price adjustments"]
    },
    {
      icon: Target,
      title: "Competitor Intelligence",
      description: "Automated competitor monitoring tracks prices across multiple channels, identifying opportunities and threats in real-time.",
      benefits: ["24/7 competitor tracking", "Price change alerts", "Market positioning insights"]
    },
    {
      icon: BarChart3,
      title: "A/B Testing & Analytics",
      description: "Test pricing strategies with statistical confidence and measure the revenue impact of every pricing decision.",
      benefits: ["Statistical significance testing", "Revenue impact measurement", "Customer behavior analysis"]
    },
    {
      icon: Zap,
      title: "Dynamic Pricing Rules",
      description: "Set intelligent pricing rules that automatically adjust prices based on inventory, demand, seasonality, and competitive positioning.",
      benefits: ["Automated price optimization", "Custom business rules", "Inventory-based adjustments"]
    }
  ]

  const pricing = [
    {
      name: "Starter",
      price: "$79",
      period: "per month",
      description: "Perfect for small businesses starting their pricing optimization journey",
      features: [
        "Up to 100 products",
        "5 competitors tracked",
        "Daily price updates",
        "Basic recommendations",
        "Email alerts",
        "Basic analytics"
      ],
      highlighted: false
    },
    {
      name: "Growth",
      price: "$299",
      period: "per month",
      description: "Ideal for growing businesses ready to scale their pricing strategy",
      features: [
        "Up to 1,000 products",
        "20 competitors tracked",
        "Hourly price updates",
        "AI-powered recommendations",
        "API access (1,000 calls/month)",
        "Advanced analytics",
        "A/B testing",
        "Priority support"
      ],
      highlighted: true
    },
    {
      name: "Scale",
      price: "$799",
      period: "per month",
      description: "For enterprises needing comprehensive pricing intelligence",
      features: [
        "Up to 10,000 products",
        "Unlimited competitors",
        "Real-time price updates",
        "Advanced ML algorithms",
        "API access (10,000 calls/month)",
        "Custom pricing rules",
        "White-label options",
        "Dedicated account manager"
      ],
      highlighted: false
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "E-commerce Director",
      company: "TechGear Plus",
      content: "PricingStrategy increased our profit margins by 23% in just 3 months. The AI recommendations are incredibly accurate.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Founder",
      company: "Urban Lifestyle",
      content: "The competitor monitoring saved us from a price war. We now make data-driven pricing decisions with confidence.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Marketing Manager",
      company: "Eco Beauty Co",
      content: "A/B testing our pricing strategies resulted in 18% higher conversion rates. This tool is a game-changer.",
      rating: 5
    }
  ]

  const stats = [
    { value: "2,500+", label: "Businesses using our platform" },
    { value: "23%", label: "Average profit increase" },
    { value: "99.9%", label: "Platform uptime" },
    { value: "$50M+", label: "Additional revenue generated" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">PricingStrategy</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Pricing</a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Testimonials</a>
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="h-4 w-4 mr-1" />
            AI-Powered Pricing Intelligence
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Optimize Your Pricing
            <br />
            <span className="text-blue-600 dark:text-blue-400">Maximize Your Revenue</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Increase profits by 15-30% with AI-powered pricing that monitors competitors 24/7 and automatically suggests the perfect price point. Stop guessing and start pricing with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="text-lg px-8 py-3" asChild>
              <Link href="/auth/signup">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Modern Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to optimize your pricing strategy and stay ahead of the competition
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-lg cursor-pointer transition-all duration-200 ${
                    activeFeature === index
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start gap-4">
                    <feature.icon className={`h-8 w-8 mt-1 ${
                      activeFeature === index ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                        {feature.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <Badge key={benefitIndex} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white">
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <Brain className="h-20 w-20 mx-auto mb-4 opacity-80" />
                  <h3 className="text-2xl font-bold mb-2">AI-Powered Intelligence</h3>
                  <p className="opacity-90">
                    Our machine learning algorithms process millions of data points to provide you with the most accurate pricing recommendations.
                  </p>
                </div>
              </div>
            </div>
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
              Choose the plan that fits your business needs. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.map((plan, index) => (
              <Card
                key={index}
                className={`p-8 relative ${
                  plan.highlighted
                    ? 'border-blue-600 shadow-xl scale-105'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                    <span className="text-gray-600 dark:text-gray-300">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {plan.description}
                  </p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href="/auth/signup">
                    Start Free Trial
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Growing Businesses
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See how businesses like yours are increasing profits with intelligent pricing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Optimize Your Pricing?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that have increased their profits with intelligent pricing strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3" asChild>
              <Link href="/auth/signup">
                Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <div className="text-sm opacity-75">
              No credit card required • 14-day free trial
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">PricingStrategy</span>
              </div>
              <p className="text-gray-400">
                AI-powered pricing optimization for modern businesses.
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
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PricingStrategy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}