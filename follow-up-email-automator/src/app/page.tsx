import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  ArrowRight,
  Mail,
  Zap,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Shield,
  Globe,
  Smartphone,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Mail className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">EmailFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            🚀 AI-Powered Email Automation
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Never Lose Another Lead to
            <span className="text-blue-600 block">Poor Follow-up</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automate personalized email sequences that convert 3x more leads while saving 10 hours per week.
            AI-powered personalization meets enterprise-grade deliverability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/register">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="/demo">Watch Demo</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale Your Email Outreach
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From AI-powered personalization to advanced analytics, we provide enterprise-grade email automation tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Proven Results That Drive Growth</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join thousands of businesses already using EmailFlow to scale their outreach.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include core features and 24/7 support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 shadow-2xl scale-105' : 'border-gray-200'}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    ${plan.price}
                    <span className="text-lg text-gray-500 font-normal">/month</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Email Outreach?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using EmailFlow to increase their conversion rates and save time.
          </p>
          <Button size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/register">
              Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Mail className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">EmailFlow</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
              <Link href="/support" className="hover:text-gray-900">Support</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
            © 2024 EmailFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Personalization',
    description: 'Generate personalized email content using GPT-4, optimized for each recipient\'s profile and behavior.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track opens, clicks, replies, and revenue attribution with real-time analytics and performance insights.',
  },
  {
    icon: Users,
    title: 'Smart Segmentation',
    description: 'Automatically segment contacts based on behavior, demographics, and custom criteria for targeted campaigns.',
  },
  {
    icon: Clock,
    title: 'Optimal Send Times',
    description: 'AI analyzes recipient behavior to determine the best time to send each email for maximum engagement.',
  },
  {
    icon: TrendingUp,
    title: 'A/B Testing',
    description: 'Test subject lines, content, and send times to continuously optimize your email performance.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'GDPR compliant with enterprise-grade security, encryption, and data protection measures.',
  },
  {
    icon: Globe,
    title: 'Multi-Channel Automation',
    description: 'Coordinate email, SMS, and push notifications in unified workflows for maximum reach.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'Fully responsive templates and mobile-first design ensure perfect display on any device.',
  },
]

const stats = [
  { value: '3.2x', label: 'Higher Conversion Rates' },
  { value: '10hrs', label: 'Saved Per Week' },
  { value: '99.5%', label: 'Delivery Rate' },
  { value: '50K+', label: 'Happy Users' },
]

const pricingPlans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for small teams getting started',
    popular: false,
    features: [
      'Up to 1,000 contacts',
      '5 email sequences',
      'Basic analytics',
      '10,000 emails/month',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: 79,
    description: 'Best for growing businesses',
    popular: true,
    features: [
      'Up to 5,000 contacts',
      'Unlimited sequences',
      'Advanced analytics',
      '50,000 emails/month',
      'A/B testing',
      'CRM integrations',
      'Priority support',
    ],
  },
  {
    name: 'Business',
    price: 199,
    description: 'For established enterprises',
    popular: false,
    features: [
      'Up to 20,000 contacts',
      'Team collaboration',
      'Custom integrations',
      '200,000 emails/month',
      'White-label options',
      'Phone support',
      'Dedicated success manager',
    ],
  },
]