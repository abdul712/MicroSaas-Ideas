'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, Brain, ShoppingCart, TrendingUp, Zap, CheckCircle, Star, Users, Shield, Globe, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Demand Forecasting',
    description: '85%+ accuracy with machine learning models that predict demand patterns, seasonality, and trends.',
    benefits: ['Prophet & TensorFlow algorithms', 'Multi-variable forecasting', 'Confidence intervals']
  },
  {
    icon: Zap,
    title: 'Automated Reordering',
    description: 'Smart algorithms automatically generate purchase orders when stock hits optimized reorder points.',
    benefits: ['Dynamic reorder points', 'Supplier performance tracking', 'Cost optimization']
  },
  {
    icon: ShoppingCart,
    title: 'Multi-Channel Sync',
    description: 'Real-time inventory synchronization across Shopify, Amazon, eBay, WooCommerce, and more.',
    benefits: ['Real-time webhooks', 'Conflict resolution', 'Platform-agnostic']
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Comprehensive dashboards with ABC analysis, velocity tracking, and profitability insights.',
    benefits: ['Real-time metrics', 'Custom reports', 'Predictive insights']
  },
  {
    icon: TrendingUp,
    title: 'Supplier Management',
    description: 'Track supplier performance, lead times, and quality scores with automated scorecards.',
    benefits: ['Performance scoring', 'Lead time optimization', 'Quality tracking']
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 Type II compliance with end-to-end encryption and role-based access control.',
    benefits: ['AES-256 encryption', 'RBAC system', 'Audit logging']
  }
]

const integrations = [
  { name: 'Shopify', logo: '/integrations/shopify.svg' },
  { name: 'Amazon', logo: '/integrations/amazon.svg' },
  { name: 'eBay', logo: '/integrations/ebay.svg' },
  { name: 'WooCommerce', logo: '/integrations/woocommerce.svg' },
  { name: 'BigCommerce', logo: '/integrations/bigcommerce.svg' },
  { name: 'Magento', logo: '/integrations/magento.svg' }
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Operations Director',
    company: 'EcoStore',
    content: 'RestockRadar reduced our stockouts by 40% while cutting inventory costs by 25%. The AI forecasting is incredibly accurate.',
    rating: 5
  },
  {
    name: 'Mike Rodriguez',
    role: 'CEO',
    company: 'TechGear Plus',
    content: 'The automated reordering saved us 15 hours per week. We can focus on growth instead of manually managing inventory.',
    rating: 5
  },
  {
    name: 'Lisa Wang',
    role: 'Inventory Manager',
    company: 'Fashion Forward',
    content: 'Multi-channel sync works flawlessly. Our inventory is always accurate across all platforms in real-time.',
    rating: 5
  }
]

const stats = [
  { label: 'Average Stockout Reduction', value: '40%' },
  { label: 'Inventory Cost Savings', value: '25%' },
  { label: 'Time Saved Per Week', value: '15hrs' },
  { label: 'Forecast Accuracy', value: '85%+' }
]

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 hidden md:flex">
            <Link className="mr-6 flex items-center space-x-2" href="/">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="hidden font-bold sm:inline-block">RestockRadar</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="#features">
                Features
              </Link>
              <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="#integrations">
                Integrations
              </Link>
              <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="#pricing">
                Pricing
              </Link>
              <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/docs">
                Docs
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">Start Free Trial</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="text-sm">
            New: AI-Powered Demand Forecasting 🧠
          </Badge>
          <h1 className={`font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            AI-Powered Inventory Management{' '}
            <span className="text-primary">That Actually Works</span>
          </h1>
          <p className={`max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Transform your inventory management with enterprise-grade AI forecasting, automated reordering, and real-time multi-channel synchronization. Reduce stockouts by 40% and cut inventory costs by 25%.
          </p>
          <div className={`flex flex-col gap-4 sm:flex-row transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Button size="lg" className="h-12 px-8" asChild>
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8" asChild>
              <Link href="/demo">
                Watch Demo
              </Link>
            </Button>
          </div>
          <div className={`flex items-center gap-2 text-sm text-muted-foreground transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <CheckCircle className="h-4 w-4 text-green-500" />
            Free 14-day trial • No credit card required • Setup in 5 minutes
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-8 md:py-12 lg:py-24">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container space-y-6 bg-slate-50 dark:bg-slate-900/50 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Features that Drive Results
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Everything you need to transform your inventory management from reactive to predictive.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="group relative overflow-hidden">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-sm">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="container py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Works with Your Existing Stack
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Seamlessly integrate with all major e-commerce platforms and marketplaces.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {integrations.map((integration, index) => (
            <div key={index} className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all">
              <div className="text-2xl font-bold text-muted-foreground">
                {integration.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container py-8 md:py-12 lg:py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Trusted by Thousands
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            See how businesses transform their inventory management with RestockRadar.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="mt-4">
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Ready to Transform Your Inventory?
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Join thousands of businesses using AI to optimize their inventory management.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8" asChild>
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8" asChild>
              <Link href="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              10,000+ users
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              50+ countries
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              24/7 support
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <BarChart3 className="h-6 w-6 text-primary" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built with enterprise-grade security and reliability.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/security">Security</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}