'use client'

import { useState } from 'react'
import { Check, Star, Zap, Shield, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for small businesses getting started with competitive intelligence',
    price: { monthly: 49, yearly: 39 },
    icon: Star,
    badge: 'Most Popular',
    features: [
      '3 competitors to monitor',
      'Daily data updates',
      'Price tracking & alerts',
      'Basic analytics dashboard',
      'Email notifications',
      'Community support',
      '14-day free trial',
    ],
    limits: {
      competitors: 3,
      scraping: 'Daily',
      storage: '1GB',
      users: 1,
    },
  },
  {
    name: 'Professional',
    description: 'Advanced features for growing businesses and marketing teams',
    price: { monthly: 149, yearly: 119 },
    icon: Zap,
    badge: 'Best Value',
    features: [
      '10 competitors to monitor',
      'Hourly data updates',
      'All tracking features',
      'Advanced analytics & insights',
      'AI-powered analysis',
      'Custom alert rules',
      'Slack & webhook integrations',
      'API access (1,000 calls/month)',
      'Priority email support',
      'Team collaboration (3 users)',
    ],
    limits: {
      competitors: 10,
      scraping: 'Hourly',
      storage: '10GB',
      users: 3,
    },
  },
  {
    name: 'Business',
    description: 'Complete competitive intelligence for established businesses',
    price: { monthly: 299, yearly: 239 },
    icon: Shield,
    badge: 'Advanced',
    features: [
      '25 competitors to monitor',
      'Real-time monitoring',
      'Advanced AI insights',
      'Custom reports & exports',
      'White-label reports',
      'Advanced integrations',
      'Full API access (10,000 calls/month)',
      'Phone & chat support',
      'Team collaboration (10 users)',
      'Custom dashboards',
      'Data export & backup',
    ],
    limits: {
      competitors: 25,
      scraping: 'Real-time',
      storage: '100GB',
      users: 10,
    },
  },
  {
    name: 'Enterprise',
    description: 'Custom solutions for large organizations with specific needs',
    price: { monthly: 'Custom', yearly: 'Custom' },
    icon: Crown,
    badge: 'Contact Sales',
    features: [
      'Unlimited competitors',
      'Custom monitoring rules',
      'Dedicated infrastructure',
      'Custom integrations & APIs',
      'Advanced security features',
      'Dedicated account manager',
      'SLA guarantees',
      'Custom training & onboarding',
      'Unlimited users',
      'Custom reporting',
      'Advanced compliance features',
    ],
    limits: {
      competitors: 'Unlimited',
      scraping: 'Custom',
      storage: 'Unlimited',
      users: 'Unlimited',
    },
  },
]

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            💰 Transparent Pricing
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-6">
            Choose the perfect plan for
            <span className="gradient-text"> your business</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Start with our 14-day free trial. No credit card required. 
            Scale up as your competitive intelligence needs grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={billingPeriod === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={billingPeriod === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}>
              Yearly
            </span>
            {billingPeriod === 'yearly' && (
              <Badge variant="secondary" className="ml-2">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const isPopular = plan.badge === 'Most Popular'
            const isEnterprise = plan.name === 'Enterprise'
            
            return (
              <Card
                key={plan.name}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  isPopular ? 'border-primary shadow-lg scale-105' : 'border-border'
                } ${isEnterprise ? 'bg-gradient-to-br from-primary/5 to-secondary/5' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    {plan.badge}
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <div className="flex justify-center mb-4">
                    <div className={`rounded-full p-3 ${
                      isEnterprise ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-primary/10'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        isEnterprise ? 'text-white' : 'text-primary'
                      }`} />
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground px-2">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-4">
                    {isEnterprise ? (
                      <div className="text-4xl font-bold">Custom</div>
                    ) : (
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold">
                          ${typeof plan.price[billingPeriod] === 'number' ? plan.price[billingPeriod] : 'Custom'}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          /{billingPeriod === 'yearly' ? 'month' : 'month'}
                        </span>
                      </div>
                    )}
                    
                    {billingPeriod === 'yearly' && !isEnterprise && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed annually
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Plan Limits */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3">Plan Limits</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Competitors: {plan.limits.competitors}</div>
                      <div>Updates: {plan.limits.scraping}</div>
                      <div>Storage: {plan.limits.storage}</div>
                      <div>Users: {plan.limits.users}</div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="px-6 pb-6">
                  <Button
                    className={`w-full ${
                      isPopular ? 'bg-primary hover:bg-primary/90' :
                      isEnterprise ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90' :
                      'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
                    }`}
                    size="lg"
                    asChild
                  >
                    <Link href={isEnterprise ? '/contact' : '/dashboard'}>
                      {isEnterprise ? 'Contact Sales' : 'Start Free Trial'}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Bottom Features */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold mb-6">All plans include:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              '14-day free trial',
              'No setup fees',
              'Cancel anytime',
              '99.9% uptime SLA',
              'GDPR compliant',
              'SOC 2 certified',
              'Advanced encryption',
              '24/7 monitoring',
            ].map((feature, i) => (
              <div key={i} className="flex items-center text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Have questions? Check out our{' '}
            <Link href="/faq" className="text-primary hover:underline">
              frequently asked questions
            </Link>
            {' '}or{' '}
            <Link href="/contact" className="text-primary hover:underline">
              contact our sales team
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}