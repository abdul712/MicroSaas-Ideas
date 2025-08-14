import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, Crown, Building } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for small businesses getting started with data-driven decisions',
    icon: Star,
    popular: false,
    features: [
      '2 data sources',
      '10 metrics tracked',
      'Basic trend detection',
      'Monthly predictions',
      'Email alerts',
      'Standard support',
      'Dashboard access',
      'CSV export'
    ],
    limitations: [
      'No API access',
      'No custom models',
      'Limited history (1 year)'
    ]
  },
  {
    name: 'Professional',
    price: 149,
    description: 'Advanced analytics and predictions for growing businesses',
    icon: Zap,
    popular: true,
    features: [
      '5 data sources',
      '50 metrics tracked',
      'Advanced pattern recognition',
      'Weekly predictions',
      'Real-time alerts',
      'Priority support',
      'Custom dashboards',
      'API access (limited)',
      'Advanced exports',
      'Team collaboration',
      'Correlation analysis',
      'Seasonal forecasting'
    ],
    limitations: [
      'Limited API calls',
      'No white-label reports'
    ]
  },
  {
    name: 'Business',
    price: 399,
    description: 'Complete business intelligence suite for data-driven organizations',
    icon: Crown,
    popular: false,
    features: [
      'Unlimited data sources',
      'Unlimited metrics',
      'AI-powered insights',
      'Daily predictions',
      'Custom alerts',
      'Phone support',
      'White-label reports',
      'Full API access',
      'Advanced analytics',
      'Multi-user teams',
      'Custom models',
      'Scenario planning',
      'Competitive analysis',
      'Industry benchmarks'
    ],
    limitations: []
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'Tailored solutions for large organizations with complex needs',
    icon: Building,
    popular: false,
    features: [
      'Everything in Business',
      'Custom integrations',
      'Dedicated infrastructure',
      'Custom algorithms',
      'Professional services',
      'Training included',
      'SLA guarantees',
      'Dedicated support',
      'On-premise deployment',
      'Advanced security',
      'Compliance reporting',
      'Custom development'
    ],
    limitations: []
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            <Crown className="h-4 w-4" />
            <span>Pricing Plans</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Choose the{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              perfect plan
            </span>{' '}
            for your business
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with our free trial and scale as you grow. All plans include our core 
            AI-powered trend analysis and predictive analytics.
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-gray-900 p-1 rounded-lg border">
            <div className="flex items-center">
              <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md">
                Monthly
              </button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Annual
              </button>
            </div>
          </div>
          <Badge variant="success" className="ml-3 mt-1">
            Save 25%
          </Badge>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const isPopular = plan.popular
            
            return (
              <Card 
                key={index} 
                className={`relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  isPopular 
                    ? 'ring-2 ring-primary shadow-primary/20 scale-105' 
                    : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-4 ${
                    isPopular 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    {plan.price ? (
                      <>
                        <div className="text-3xl font-bold">
                          ${plan.price}
                          <span className="text-base font-normal text-muted-foreground">/month</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${Math.floor(plan.price * 0.75)}/month billed annually
                        </div>
                      </>
                    ) : (
                      <div className="text-3xl font-bold">Custom</div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-center space-x-3 opacity-50">
                        <div className="h-4 w-4 rounded-full border border-gray-300 flex-shrink-0" />
                        <span className="text-sm line-through">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="pt-4">
                    {plan.price ? (
                      <Link href="/auth/register" className="w-full">
                        <Button 
                          className="w-full" 
                          variant={isPopular ? "default" : "outline"}
                          size="lg"
                        >
                          {index === 0 ? 'Start Free Trial' : 'Get Started'}
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/contact" className="w-full">
                        <Button variant="outline" size="lg" className="w-full">
                          Contact Sales
                        </Button>
                      </Link>
                    )}
                    
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {plan.price ? '14-day free trial • No credit card required' : 'Custom pricing and features'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">What's included in the free trial?</h4>
                <p className="text-sm text-muted-foreground">
                  The 14-day free trial includes all Professional features with no limitations.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">How accurate are the predictions?</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI models achieve 95% accuracy on average, continuously improving with more data.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Is my data secure?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, we use bank-level encryption and are SOC 2 compliant. Your data is never shared.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Do you offer custom integrations?</h4>
                <p className="text-sm text-muted-foreground">
                  Enterprise plans include custom integrations. Contact us for specific requirements.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">What support do you provide?</h4>
                <p className="text-sm text-muted-foreground">
                  All plans include support. Higher tiers get priority and phone support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}