'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, Eye, Target, TrendingUp, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const [email, setEmail] = useState('')

  const features = [
    {
      icon: <Eye className="h-8 w-8 text-primary" />,
      title: "Visual Journey Maps",
      description: "Create stunning visual representations of your customer journeys with drag-and-drop simplicity."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Real-time Analytics",
      description: "Track customer behavior across all touchpoints in real-time with powerful analytics."
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Conversion Optimization",
      description: "Identify bottlenecks and optimize conversion rates at every stage of the customer journey."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Customer Segmentation",
      description: "Segment customers based on behavior and create personalized journey experiences."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "AI-Powered Insights",
      description: "Get actionable recommendations powered by machine learning and predictive analytics."
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Multi-Channel Tracking",
      description: "Track interactions across web, mobile, email, social media, and offline channels."
    }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "VP of Marketing at TechCorp",
      content: "Customer Journey Mapper helped us increase our conversion rate by 34% in just 3 months. The insights are incredible!",
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "UX Director at E-commerce Plus",
      content: "Finally, a tool that shows us exactly where customers drop off. We've reduced our bounce rate by 28%.",
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "Customer Success Manager at SaaS Solutions",
      content: "The real-time analytics and AI recommendations have transformed how we approach customer experience.",
      avatar: "ER"
    }
  ]

  const pricingTiers = [
    {
      name: "Starter",
      price: "$79",
      description: "Perfect for small businesses getting started with journey mapping",
      features: [
        "Up to 10,000 monthly events",
        "3 journey maps",
        "Basic analytics",
        "Email support",
        "30-day data retention"
      ]
    },
    {
      name: "Growth",
      price: "$299",
      description: "For growing companies that need advanced analytics",
      features: [
        "Up to 100,000 monthly events",
        "Unlimited journeys",
        "Advanced analytics",
        "Priority support",
        "90-day data retention",
        "API access"
      ]
    },
    {
      name: "Professional",
      price: "$799",
      description: "For enterprises requiring comprehensive journey insights",
      features: [
        "Up to 1M monthly events",
        "Custom segments",
        "Predictive analytics",
        "Phone support",
        "1-year data retention",
        "White-label options"
      ]
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-primary"></div>
            <span className="text-xl font-bold">Customer Journey Mapper</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Testimonials
            </Link>
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-4 text-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Map Your Customer's Journey to{' '}
              <span className="text-primary">Success</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Visualize every touchpoint, optimize conversion paths, and increase revenue by 
              understanding your customer's complete journey across all channels.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="px-8" asChild>
                <Link href="/auth/register">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                Watch Demo
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              ✓ 14-day free trial ✓ No credit card required ✓ Setup in 5 minutes
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Everything You Need to Understand Your Customers
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to give you complete visibility into your customer journey
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
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

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 px-4 bg-muted/50">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Trusted by Customer Experience Leaders
              </h2>
              <p className="text-xl text-muted-foreground">
                See how companies are transforming their customer experience
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-md">
                  <CardContent className="pt-6">
                    <blockquote className="text-lg mb-4">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-muted-foreground">
                Choose the plan that fits your business needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <Card key={index} className={`border-0 shadow-md ${index === 1 ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader className="text-center">
                    {index === 1 && (
                      <div className="text-sm font-semibold text-primary mb-2">MOST POPULAR</div>
                    )}
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <div className="text-4xl font-bold">
                      {tier.price}<span className="text-lg text-muted-foreground">/month</span>
                    </div>
                    <CardDescription className="text-base">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">
                            ✓
                          </div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={index === 1 ? "default" : "outline"}>
                      Start Free Trial
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 bg-primary text-primary-foreground">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Ready to Transform Your Customer Experience?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of companies already using Customer Journey Mapper to increase 
              conversions and improve customer satisfaction.
            </p>
            <Button size="lg" variant="secondary" className="px-8" asChild>
              <Link href="/auth/register">
                Start Your Free Trial Today <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 rounded bg-primary"></div>
                <span className="font-bold">Customer Journey Mapper</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete platform for understanding and optimizing your customer journey.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Features</Link></li>
                <li><Link href="#" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="#" className="hover:text-primary">Integrations</Link></li>
                <li><Link href="#" className="hover:text-primary">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Documentation</Link></li>
                <li><Link href="#" className="hover:text-primary">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary">Case Studies</Link></li>
                <li><Link href="#" className="hover:text-primary">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">About</Link></li>
                <li><Link href="#" className="hover:text-primary">Privacy</Link></li>
                <li><Link href="#" className="hover:text-primary">Terms</Link></li>
                <li><Link href="#" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
            © 2024 Customer Journey Mapper. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}