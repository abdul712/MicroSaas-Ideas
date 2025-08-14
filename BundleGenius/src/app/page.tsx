"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingCart, 
  TrendingUp, 
  Zap, 
  Target, 
  Brain,
  BarChart3,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Rocket
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) {
      router.push("/dashboard")
    }
  }, [session, router])

  const handleGetStarted = () => {
    setIsLoading(true)
    router.push("/auth/signin")
  }

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Recommendations",
      description: "Advanced machine learning algorithms analyze your products to suggest optimal bundles that maximize revenue.",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: TrendingUp,
      title: "Dynamic Pricing Optimization",
      description: "Automatically optimize bundle prices based on market conditions, demand patterns, and profit margins.",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Target,
      title: "Conversion Rate Boost",
      description: "Increase average order value by 15-30% with scientifically-backed bundling strategies.",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track bundle performance with comprehensive analytics and actionable insights for continuous improvement.",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      icon: Zap,
      title: "Seamless Integration",
      description: "Connect with Shopify, WooCommerce, BigCommerce, and other major e-commerce platforms in minutes.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      icon: Users,
      title: "A/B Testing Framework",
      description: "Test different bundling strategies with built-in statistical significance testing and optimization.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    }
  ]

  const stats = [
    { value: "15-30%", label: "Revenue Increase", icon: DollarSign },
    { value: "40%", label: "Higher AOV", icon: TrendingUp },
    { value: "2x", label: "Faster Setup", icon: Rocket },
    { value: "99.9%", label: "Uptime", icon: CheckCircle }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "E-commerce Manager",
      company: "Fashion Forward",
      content: "BundleGenius increased our AOV by 28% within the first month. The AI recommendations are incredibly accurate.",
      avatar: "SC"
    },
    {
      name: "Michael Rodriguez",
      role: "Marketing Director", 
      company: "TechGadgets Pro",
      content: "The A/B testing feature helped us optimize our bundling strategy. Revenue per visitor improved by 35%.",
      avatar: "MR"
    },
    {
      name: "Emily Johnson",
      role: "Store Owner",
      company: "Organic Essentials",
      content: "Setup was incredibly easy. The Shopify integration worked flawlessly and we saw results immediately.",
      avatar: "EJ"
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "$99",
      period: "month",
      description: "Perfect for small stores getting started with bundling",
      features: [
        "Up to 100 SKUs",
        "Basic bundle recommendations", 
        "Standard pricing rules",
        "Email support",
        "Shopify integration"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$299", 
      period: "month",
      description: "Advanced features for growing e-commerce businesses",
      features: [
        "Up to 1,000 SKUs",
        "AI-powered recommendations",
        "Dynamic pricing optimization",
        "A/B testing framework",
        "Priority support",
        "All platform integrations",
        "Advanced analytics"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$999",
      period: "month", 
      description: "Full-featured solution for large-scale operations",
      features: [
        "Unlimited SKUs",
        "Custom ML models",
        "API access",
        "Dedicated success manager",
        "White-label options",
        "Custom integrations",
        "99.9% SLA guarantee"
      ],
      popular: false
    }
  ]

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">BundleGenius</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button onClick={handleGetStarted} disabled={isLoading}>
                {isLoading ? (
                  <div className="spinner w-4 h-4 mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered E-commerce Optimization
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            Boost Revenue with
            <span className="gradient-text block">Intelligent Bundling</span>
          </h1>
          
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Advanced machine learning algorithms analyze your product data to create 
            high-converting bundles that increase average order value by up to 30%.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={handleGetStarted} className="button-hover">
              <Rocket className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Demo
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Maximum Impact
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, optimize, and manage high-converting product bundles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="card-hover border-0 shadow-sm">
                  <CardHeader>
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your business size and requirements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative card-hover ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-8" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={handleGetStarted}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by E-commerce Leaders
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how businesses are driving growth with BundleGenius
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-hover">
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-primary">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="gradient-bg text-white text-center p-12">
            <CardContent className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Boost Your Revenue?
              </h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Join thousands of e-commerce businesses using BundleGenius to 
                optimize their product bundling and increase sales.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" variant="secondary" onClick={handleGetStarted}>
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Free 30-Day Trial
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Contact Sales
                </Button>
              </div>
              <p className="text-sm opacity-75">
                No credit card required • Setup in 5 minutes • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">BundleGenius</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 BundleGenius. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}