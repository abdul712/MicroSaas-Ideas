import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap } from 'lucide-react'
import { signIn } from 'next-auth/react'

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: 'Forever Free',
    description: 'Perfect for individual creators getting started',
    features: [
      '30 hashtag searches per month',
      '3 saved hashtag sets',
      'Basic analytics',
      'Instagram + Twitter support',
      'Email support'
    ],
    popular: false,
    buttonText: 'Get Started Free',
    buttonVariant: 'outline' as const
  },
  {
    name: 'Professional',
    price: '$19',
    period: 'per month',
    description: 'Ideal for content creators and small businesses',
    features: [
      'Unlimited hashtag searches',
      'Unlimited saved sets',
      'Advanced analytics & insights',
      'All platforms (Instagram, Twitter, TikTok, LinkedIn)',
      'Competitor analysis (5 competitors)',
      'AI-powered recommendations',
      'Priority support'
    ],
    popular: true,
    buttonText: 'Start 14-Day Free Trial',
    buttonVariant: 'default' as const
  },
  {
    name: 'Business',
    price: '$49',
    period: 'per month',
    description: 'Perfect for agencies and growing businesses',
    features: [
      'Everything in Professional',
      'Team collaboration (up to 5 users)',
      'Competitor analysis (25 competitors)',
      'Custom hashtag recommendations',
      'API access',
      'White-label reports',
      'Dedicated account manager'
    ],
    popular: false,
    buttonText: 'Start 14-Day Free Trial',
    buttonVariant: 'outline' as const
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose the perfect plan for your hashtag research needs. All plans include our core features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    {plan.period}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.buttonVariant}
                  className="w-full"
                  size="lg"
                  onClick={() => signIn()}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400">
            All plans include 14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}