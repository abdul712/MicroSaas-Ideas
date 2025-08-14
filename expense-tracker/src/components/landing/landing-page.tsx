'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Receipt, 
  Camera, 
  PieChart, 
  Shield, 
  Zap, 
  Users, 
  Check,
  ArrowRight,
  Star,
  TrendingUp,
  CreditCard,
  FileText,
  Smartphone
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const features = [
  {
    icon: <Camera className="h-8 w-8" />,
    title: 'AI-Powered Receipt Scanning',
    description: 'Snap a photo and let our advanced OCR technology extract all the important details automatically.',
    highlights: ['95%+ accuracy', 'Instant processing', 'Multi-currency support']
  },
  {
    icon: <PieChart className="h-8 w-8" />,
    title: 'Smart Categorization',
    description: 'Expenses are automatically categorized using machine learning for maximum tax deductions.',
    highlights: ['IRS-compliant categories', 'Custom categories', 'Tax optimization']
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: 'Enterprise Security',
    description: 'Bank-level security with encryption, MFA, and comprehensive audit trails.',
    highlights: ['256-bit encryption', 'Multi-factor auth', 'GDPR compliant']
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Multi-Tenant Architecture',
    description: 'Perfect for teams with role-based access control and approval workflows.',
    highlights: ['Team collaboration', 'Approval workflows', 'Role management']
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: 'Advanced Analytics',
    description: 'Get insights into spending patterns, budget tracking, and financial trends.',
    highlights: ['Real-time dashboards', 'Custom reports', 'Budget alerts']
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: 'API Integration',
    description: 'Connect with QuickBooks, Xero, and other accounting platforms seamlessly.',
    highlights: ['REST APIs', 'Webhook support', 'Third-party sync']
  }
]

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      '20 receipts per month',
      'Basic categorization',
      '1 monthly report',
      '3-month data retention',
      'Mobile app access'
    ],
    cta: 'Start Free',
    popular: false
  },
  {
    name: 'Personal',
    price: '$4.99',
    period: '/month',
    description: 'For freelancers and small business owners',
    features: [
      'Unlimited receipts',
      'AI-powered categorization',
      'Unlimited reports',
      'Cloud backup',
      'Bank connections',
      'Mobile & web access',
      'Email support'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Professional',
    price: '$9.99',
    period: '/month',
    description: 'For growing businesses',
    features: [
      'Everything in Personal',
      'Mileage tracking',
      'Accounting integrations',
      'Advanced analytics',
      'Custom categories',
      'Priority support',
      'Team collaboration (5 users)'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Business',
    price: '$19.99',
    period: '/month',
    description: 'For established businesses',
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'Approval workflows',
      'API access',
      'White-label reports',
      'Dedicated support',
      'Custom integrations'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Freelance Consultant',
    content: 'ExpenseTracker Pro has saved me hours every month. The OCR is incredibly accurate and the tax categorization is spot-on.',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Small Business Owner',
    content: 'The team features and approval workflows have streamlined our expense management completely. Highly recommended!',
    rating: 5
  },
  {
    name: 'Lisa Rodriguez',
    role: 'Real Estate Agent',
    content: 'I love how I can snap a photo of a receipt and everything is handled automatically. Makes tax season so much easier.',
    rating: 5
  }
]

export function LandingPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ExpenseTracker Pro
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Testimonials
              </Link>
              {session ? (
                <Button asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" asChild>
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            🚀 AI-Powered Expense Management
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            Transform Your
            <span className="text-blue-600"> Expense </span>
            Management
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Snap a photo of any receipt and let AI handle the rest. Track expenses in seconds, 
            never lose a receipt again, and maximize your tax deductions with intelligent 
            categorization and real-time insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="text-lg px-8 py-4" asChild>
              <Link href="/auth/signup">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
              <Link href="#demo">
                Watch Demo
              </Link>
            </Button>
          </div>
          
          {/* Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">95%+</div>
              <div className="text-gray-600 dark:text-gray-300">OCR Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">&lt; 3s</div>
              <div className="text-gray-600 dark:text-gray-300">Processing Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10k+</div>
              <div className="text-gray-600 dark:text-gray-300">Happy Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Expense Management
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built for modern businesses with enterprise-grade features and consumer-friendly simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="relative group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`relative ${tier.popular ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-gray-600 dark:text-gray-400">{tier.period}</span>
                  </div>
                  <CardDescription className="mt-2">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    className={`w-full mb-6 ${tier.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={tier.popular ? 'default' : 'outline'}
                  >
                    {tier.cta}
                  </Button>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Thousands of Users
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See what our customers have to say about ExpenseTracker Pro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic mb-4">
                    &ldquo;{testimonial.content}&rdquo;
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Expense Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already saving time and maximizing their tax deductions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4" asChild>
              <Link href="/auth/signup">
                Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-blue-600">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 dark:bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Receipt className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">ExpenseTracker Pro</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered expense management for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/api" className="hover:text-white">API</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/gdpr" className="hover:text-white">GDPR</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2024 ExpenseTracker Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}