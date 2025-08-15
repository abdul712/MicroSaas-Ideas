'use client'

import { Button } from '@/components/ui/button'
import { Check, Star } from 'lucide-react'

export function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: 19,
      description: 'Perfect for new podcasters',
      features: [
        '10 hours of transcription/month',
        'Basic show notes generation',
        'SEO optimization',
        '2 platform integrations',
        'Email support',
        'Standard processing speed'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: 39,
      description: 'For established podcasters',
      features: [
        '50 hours of transcription/month',
        'Advanced show notes + social content',
        'All platform integrations',
        'Analytics dashboard',
        'Custom templates',
        'Priority processing',
        'Chat support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 99,
      description: 'For podcast networks',
      features: [
        'Unlimited transcription',
        'White-label options',
        'API access',
        'Team collaboration',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ]

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-600">
            Choose the plan that fits your podcast. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl border-2 ${
                plan.popular
                  ? 'border-podcast-500 bg-podcast-50/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center px-3 py-1 bg-podcast-600 text-white text-sm font-medium rounded-full">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                  <span className="text-lg text-gray-600 font-normal">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-podcast-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? 'podcast' : 'outline'}
                className="w-full"
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}