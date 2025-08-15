'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Users, 
  Shield, 
  CreditCard, 
  BarChart3, 
  MessageCircle,
  Zap,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Building2,
    title: 'Drag & Drop Site Builder',
    description: 'Create professional membership sites with our intuitive visual builder. No coding required.'
  },
  {
    icon: Users,
    title: 'Member Management',
    description: 'Manage memberships, tiers, and access levels with advanced member analytics.'
  },
  {
    icon: Shield,
    title: 'Content Protection',
    description: 'Secure your premium content with DRM protection and access controls.'
  },
  {
    icon: CreditCard,
    title: 'Payment Processing',
    description: 'Integrated Stripe billing with subscriptions, trials, and invoicing.'
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track member engagement, revenue, and site performance in real-time.'
  },
  {
    icon: MessageCircle,
    title: 'Community Features',
    description: 'Foster engagement with discussions, events, and member networking.'
  }
]

const pricingPlans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for getting started',
    features: [
      '1 membership site',
      'Up to 100 members',
      'Basic templates',
      'Email support',
      '5% transaction fee'
    ],
    badge: null
  },
  {
    name: 'Growth',
    price: 79,
    description: 'Scale your membership business',
    features: [
      '3 membership sites',
      'Up to 1,000 members',
      'Premium templates',
      'Priority support',
      '3% transaction fee',
      'Custom domain'
    ],
    badge: 'Popular'
  },
  {
    name: 'Scale',
    price: 199,
    description: 'For serious membership sites',
    features: [
      'Unlimited sites',
      'Unlimited members',
      'All templates',
      'White-label option',
      '1% transaction fee',
      'API access'
    ],
    badge: null
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-4 h-4 mr-2" />
              Launch in 60 minutes
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Build <span className="text-blue-600">Membership Sites</span> That Convert
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create, launch, and scale professional membership sites with integrated payments, 
              content protection, and community features. No coding required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/auth/register">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link href="/demo">
                  View Demo
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              All the tools and features you need to build, launch, and grow your membership business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Trusted by Creators Worldwide
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Sites Created</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">50k+</div>
              <div className="text-gray-600">Members Managed</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">$2M+</div>
              <div className="text-gray-600">Revenue Processed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs. Upgrade or downgrade at any time.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className={`p-8 relative h-full ${plan.badge ? 'border-blue-500 border-2' : ''}`}>
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      {plan.badge}
                    </Badge>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      ${plan.price}
                      <span className="text-lg text-gray-600">/month</span>
                    </div>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.badge ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/auth/register">
                      Start Free Trial
                    </Link>
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Build Your Membership Empire?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of creators who have launched successful membership sites. 
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link href="/auth/register">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/contact">
                Talk to Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8 text-blue-500 mr-2" />
                <span className="text-xl font-bold">MembershipBuilder</span>
              </div>
              <p className="text-gray-400">
                The easiest way to build and launch professional membership sites.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/templates" className="hover:text-white">Templates</Link></li>
                <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/guides" className="hover:text-white">Guides</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MembershipBuilder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}