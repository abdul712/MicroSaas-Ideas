'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Zap, Crown, Building2 } from 'lucide-react'

export function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: 79,
      description: 'Perfect for small businesses getting started with journey mapping',
      icon: Zap,
      color: 'border-gray-200',
      popular: false,
      features: [
        '10,000 monthly events',
        '3 journey maps',
        'Basic analytics dashboard',
        'Email support',
        '30-day data retention',
        'Standard integrations',
        'Mobile app access'
      ],
      limitations: [
        'No custom segments',
        'No AI insights',
        'No API access'
      ]
    },
    {
      name: 'Growth',
      price: 299,
      description: 'For growing companies that need advanced analytics and optimization',
      icon: Crown,
      color: 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20',
      popular: true,
      features: [
        '100,000 monthly events',
        'Unlimited journey maps',
        'Advanced analytics & funnels',
        'AI-powered insights',
        'Priority support',
        '90-day data retention',
        'API access',
        'Custom segments',
        'A/B testing tools',
        'Advanced integrations',
        'Slack notifications'
      ],
      limitations: []
    },
    {
      name: 'Professional',
      price: 799,
      description: 'For enterprises requiring advanced features and compliance',
      icon: Building2,
      color: 'border-gray-200',
      popular: false,
      features: [
        '1,000,000 monthly events',
        'Unlimited everything',
        'Predictive analytics',
        'Custom dashboards',
        'Phone & chat support',
        '1-year data retention',
        'White-label options',
        'Advanced security',
        'Custom integrations',
        'Dedicated CSM',
        'SLA guarantees',
        'Export capabilities'
      ],
      limitations: []
    }
  ]

  const enterpriseFeatures = [
    'Unlimited events & users',
    'On-premise deployment',
    'Custom data pipeline',
    'Advanced compliance',
    'Dedicated infrastructure',
    'Priority feature requests'
  ]

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your needs. All plans include a 14-day free trial 
            with no credit card required.
          </p>
          
          {/* Billing toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 border">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md">
              Monthly
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-600">
              Annual
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.color} ${plan.popular ? 'scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 text-sm font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <plan.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <Link href="/auth/signup" className="block">
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Start Free Trial
                  </Button>
                </Link>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Everything included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enterprise section */}
        <Card className="bg-gradient-to-r from-gray-900 to-blue-900 text-white">
          <CardContent className="p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                  Enterprise
                </h3>
                <p className="text-xl text-gray-200 mb-6">
                  Custom solutions for large organizations with specific requirements
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {enterpriseFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-400" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="secondary" size="lg">
                    Contact Sales
                  </Button>
                  <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-gray-900">
                    Schedule Demo
                  </Button>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-lg mb-4">What's included:</h4>
                <ul className="space-y-2 text-sm">
                  <li>✓ Dedicated account manager</li>
                  <li>✓ Custom onboarding & training</li>
                  <li>✓ 99.9% SLA guarantee</li>
                  <li>✓ Advanced security & compliance</li>
                  <li>✓ Priority feature development</li>
                  <li>✓ 24/7 premium support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {[
              {
                question: "What counts as an event?",
                answer: "An event is any tracked user interaction like page views, clicks, form submissions, or custom actions. We provide detailed analytics on your usage."
              },
              {
                question: "Can I change plans anytime?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing accordingly."
              },
              {
                question: "Do you offer data migration?",
                answer: "Yes, we provide free data migration assistance for Professional and Enterprise plans. Our team will help you import your historical data."
              },
              {
                question: "What about data security?",
                answer: "We use enterprise-grade security with SOC 2 compliance, data encryption, and regular security audits. Your data is always protected and owned by you."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}