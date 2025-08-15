'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Shield, 
  Users, 
  Globe,
  ArrowRight,
  Star,
  Check,
  Play,
  Download,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Monitor your sales performance with live data updates and interactive dashboards that refresh automatically."
  },
  {
    icon: TrendingUp,
    title: "AI-Powered Forecasting",
    description: "Get accurate sales predictions using machine learning algorithms trained on your historical data."
  },
  {
    icon: Zap,
    title: "Instant Integrations",
    description: "Connect with Salesforce, HubSpot, Shopify, and 50+ other platforms in just a few clicks."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level security with SOC 2 compliance, encryption, and role-based access controls."
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share insights, create custom reports, and collaborate with your sales team in real-time."
  },
  {
    icon: Globe,
    title: "Multi-channel View",
    description: "Unify data from all sales channels into one comprehensive dashboard for complete visibility."
  }
]

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "VP of Sales",
    company: "TechCorp",
    content: "This dashboard transformed how we track sales performance. Revenue increased 32% in the first quarter.",
    rating: 5,
    avatar: "/avatars/sarah.jpg"
  },
  {
    name: "Michael Chen",
    role: "Sales Director",
    company: "GrowthStart",
    content: "The AI forecasting is incredibly accurate. We can now predict quarterly results with 95% confidence.",
    rating: 5,
    avatar: "/avatars/michael.jpg"
  },
  {
    name: "Emily Rodriguez",
    role: "Revenue Operations",
    company: "ScaleUp Inc",
    content: "Real-time insights help us spot trends immediately. The team dashboard keeps everyone aligned.",
    rating: 5,
    avatar: "/avatars/emily.jpg"
  }
]

const pricingPlans = [
  {
    name: "Starter",
    price: 69,
    description: "Perfect for small sales teams",
    features: [
      "1 sales channel",
      "Up to $100K monthly revenue",
      "5 dashboard views",
      "30-day data history",
      "Email support"
    ],
    popular: false
  },
  {
    name: "Growth",
    price: 199,
    description: "Ideal for growing businesses",
    features: [
      "3 sales channels",
      "Up to $500K monthly revenue",
      "Unlimited dashboards",
      "1-year data history",
      "Custom alerts",
      "Priority support"
    ],
    popular: true
  },
  {
    name: "Scale",
    price: 499,
    description: "Built for enterprise teams",
    features: [
      "Unlimited channels",
      "Unlimited revenue",
      "Advanced analytics",
      "API access",
      "White-label option",
      "Dedicated support"
    ],
    popular: false
  }
]

export function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">SalesPerf</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-sm hover:text-primary transition-colors">
                Reviews
              </Link>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
              <Button size="sm">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Transform Your Sales Data Into{' '}
              <span className="text-primary">Growth</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade sales analytics platform with real-time insights, AI-powered forecasting, 
              and seamless integrations. Increase revenue by 25% with data-driven intelligence.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="gradient" className="text-lg px-8">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="xl" variant="outline" className="text-lg px-8">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • Setup in 5 minutes • Cancel anytime
            </p>
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 40 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 container mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-card border rounded-3xl shadow-2xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/5 to-purple-600/5 p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                  {/* Revenue Chart Placeholder */}
                  <div className="md:col-span-2 bg-white/80 dark:bg-gray-900/80 rounded-xl p-4 border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Revenue Analytics</h3>
                      <div className="flex items-center text-success-600 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +18.2%
                      </div>
                    </div>
                    <div className="h-40 bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg flex items-end justify-around p-4">
                      {[65, 78, 85, 72, 90, 88, 95].map((height, i) => (
                        <div
                          key={i}
                          className="bg-primary rounded-t-sm"
                          style={{ height: `${height}%`, width: '12px' }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="space-y-4">
                    <div className="bg-white/80 dark:bg-gray-900/80 rounded-xl p-4 border">
                      <div className="text-2xl font-bold">$2.4M</div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                      <div className="text-xs text-success-600 mt-1">+12.5% vs last month</div>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-900/80 rounded-xl p-4 border">
                      <div className="text-2xl font-bold">1,247</div>
                      <div className="text-sm text-muted-foreground">Active Deals</div>
                      <div className="text-xs text-success-600 mt-1">+8.3% vs last month</div>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-900/80 rounded-xl p-4 border">
                      <div className="text-2xl font-bold">34.2%</div>
                      <div className="text-sm text-muted-foreground">Conversion Rate</div>
                      <div className="text-xs text-warning-600 mt-1">-2.1% vs last month</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need for Sales Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to transform your sales data into actionable insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by Sales Teams Worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              See how companies are growing with our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl p-6 border"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`bg-card rounded-xl p-8 border relative ${
                  plan.popular ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 text-success-600 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  Start Free Trial
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Need a custom solution for your enterprise?
            </p>
            <Button variant="outline" size="lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Transform Your Sales Performance?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of companies already using our platform to drive revenue growth 
              and make data-driven sales decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="secondary" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="xl" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Download className="mr-2 h-5 w-5" />
                Download Brochure
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground">API</Link></li>
                <li><Link href="#" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground">Community</Link></li>
                <li><Link href="#" className="hover:text-foreground">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground">Cookies</Link></li>
                <li><Link href="#" className="hover:text-foreground">GDPR</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="font-semibold">SalesPerf</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 sm:mt-0">
              © 2024 SalesPerf. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}