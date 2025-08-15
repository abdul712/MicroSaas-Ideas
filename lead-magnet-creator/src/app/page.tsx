import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle, Zap, Users, TrendingUp, Shield, Palette, Brain, BarChart3, Rocket, Star, Download } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Lead Magnet Creator</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signin">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section">
        <div className="container">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-2">
              <Rocket className="w-4 h-4 mr-2" />
              AI-Powered Lead Generation Platform
            </Badge>
            
            <div className="space-y-4">
              <h1 className="gradient-text text-balance">
                Create High-Converting Lead Magnets in Minutes
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-balance">
                Turn your ideas into professional lead magnets with our AI-powered platform. 
                No design skills needed. Choose a template, customize with AI, and start capturing leads immediately.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signin">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Creating Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Download className="w-5 h-5 mr-2" />
                View Examples
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                AI-powered content
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-white dark:bg-gray-800">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Everything You Need for Lead Generation
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform combines AI technology with professional design tools to help you create lead magnets that convert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section">
        <div className="container">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-white">
            <div className="text-center space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Join Thousands of Marketers Creating Better Lead Magnets
              </h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold">{stat.value}</div>
                    <div className="text-blue-100">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section bg-white dark:bg-gray-800">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Choose the plan that fits your lead generation needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`card-hover ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className="text-center">
                  {plan.popular && (
                    <Badge className="mx-auto mb-4">Most Popular</Badge>
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-lg text-gray-500">/month</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 lg:p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Create Your First Lead Magnet?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of marketers who are already creating high-converting lead magnets with our AI-powered platform.
            </p>
            <Link href="/auth/signin">
              <Button size="lg">
                Get Started for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Lead Magnet Creator</span>
            </div>
            <p className="text-gray-400 mb-8">
              Create high-converting lead magnets with AI-powered tools
            </p>
            <div className="text-gray-400 text-sm">
              © 2024 Lead Magnet Creator. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Brain,
    title: 'AI Content Generation',
    description: 'Generate compelling content for any lead magnet type using advanced AI.',
    benefits: [
      'GPT-4 powered content creation',
      'Industry-specific templates',
      'Multi-format output support',
      'Instant optimization suggestions'
    ]
  },
  {
    icon: Palette,
    title: 'Professional Design Editor',
    description: 'Create stunning visuals with our intuitive drag-and-drop editor.',
    benefits: [
      'Drag-and-drop interface',
      'Professional templates',
      'Brand kit integration',
      'Mobile-responsive designs'
    ]
  },
  {
    icon: TrendingUp,
    title: 'Conversion Optimization',
    description: 'Built-in A/B testing and analytics to maximize your conversion rates.',
    benefits: [
      'A/B testing framework',
      'Real-time analytics',
      'Conversion tracking',
      'Performance insights'
    ]
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together with your team on lead magnet creation and optimization.',
    benefits: [
      'Real-time collaboration',
      'Comment system',
      'Version control',
      'Role-based permissions'
    ]
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level security with GDPR compliance and data protection.',
    benefits: [
      'GDPR compliance',
      'Data encryption',
      'Audit logging',
      'SOC 2 compliance'
    ]
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Deep insights into your lead magnet performance and ROI.',
    benefits: [
      'Conversion tracking',
      'Lead quality scoring',
      'ROI calculations',
      'Custom reports'
    ]
  }
]

const stats = [
  { value: '50K+', label: 'Lead Magnets Created' },
  { value: '2M+', label: 'Leads Captured' },
  { value: '35%', label: 'Average Conversion Rate' },
  { value: '99.9%', label: 'Uptime Guarantee' }
]

const pricingPlans = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for small businesses and solopreneurs',
    features: [
      '10 AI generations/month',
      '5,000 visitors/month',
      'Basic templates',
      'Form builder',
      'Email support'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Professional',
    price: 99,
    description: 'Ideal for growing businesses and marketers',
    features: [
      '50 AI generations/month',
      '25,000 visitors/month',
      'Premium templates',
      'A/B testing',
      'Image generation',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'For large teams and agencies',
    features: [
      '200 AI generations/month',
      'Unlimited visitors',
      'Custom branding',
      'Team collaboration',
      'API access',
      'Dedicated support'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]