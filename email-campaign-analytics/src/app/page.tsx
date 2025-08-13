import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Mail, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Email Campaign Analytics | Transform Your Email Marketing Data',
  description: 'Advanced email marketing analytics platform with multi-provider integration, A/B testing, subscriber intelligence, and AI-powered insights.',
}

const features = [
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'Advanced Campaign Analytics',
    description: 'Real-time performance tracking, A/B testing framework, and cohort analysis with statistical significance.'
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Subscriber Intelligence',
    description: 'Individual behavior tracking, engagement prediction, and automated segmentation based on preferences.'
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: 'Deliverability Monitoring',
    description: 'Inbox placement tracking, sender reputation management, and automated list cleaning.'
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: 'Revenue Attribution',
    description: 'E-commerce integration, customer lifetime value analysis, and multi-touch attribution modeling.'
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: 'Real-time Analytics',
    description: 'Live dashboard updates, instant notifications, and real-time campaign performance monitoring.'
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: 'Multi-Provider Support',
    description: 'Connect Mailchimp, Klaviyo, SendGrid, and 8+ other email service providers in one dashboard.'
  }
]

const providers = [
  'Mailchimp', 'Klaviyo', 'SendGrid', 'Campaign Monitor',
  'ConvertKit', 'ActiveCampaign', 'Constant Contact', 'HubSpot',
  'Mailgun', 'Sendinblue'
]

const benefits = [
  'Increase open rates by up to 35%',
  'Boost click-through rates by 45%',
  'Improve deliverability scores by 25%',
  'Reduce churn with predictive analytics',
  'Optimize send times with AI',
  'Track revenue attribution accurately'
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold">Email Analytics</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              🚀 Advanced Email Marketing Analytics
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Transform Your Email Data Into{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Revenue Growth
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Connect all your email providers, uncover deep insights, and optimize campaigns with 
              AI-powered analytics. From deliverability monitoring to revenue attribution - everything 
              you need to maximize your email marketing ROI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="min-w-[200px]">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  View Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              14-day free trial • No credit card required • Setup in minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Everything You Need for Email Success
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our comprehensive analytics platform gives you deep insights into every aspect 
              of your email marketing performance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Providers Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Connect Your Favorite Email Tools
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Seamlessly integrate with 10+ major email service providers and get unified analytics across all your campaigns.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center">
            {providers.map((provider, index) => (
              <div key={index} className="text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {provider}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Proven Results for Email Marketers
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join thousands of marketers who've improved their email performance with our analytics platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center bg-white/10 backdrop-blur rounded-lg p-6">
                <CheckCircle className="h-6 w-6 text-green-300 mr-3 flex-shrink-0" />
                <span className="text-white font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-12 text-center">
            <Star className="h-12 w-12 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Ready to Optimize Your Email Campaigns?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Start your free trial today and discover insights that will transform your email marketing performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="min-w-[200px]">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  Contact Sales
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Get setup in under 5 minutes • Cancel anytime • 24/7 support
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Mail className="h-6 w-6 text-primary mr-2" />
                <span className="text-lg font-bold">Email Analytics</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Advanced email marketing analytics platform for modern marketers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/integrations">Integrations</Link></li>
                <li><Link href="/api">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/docs">Documentation</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/status">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 Email Campaign Analytics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}