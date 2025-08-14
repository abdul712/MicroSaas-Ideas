'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Zap, 
  Crown, 
  Building, 
  Sparkles,
  ArrowRight,
  Star
} from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out hashtag research',
    price: 0,
    period: 'forever',
    icon: Sparkles,
    color: 'from-gray-500 to-gray-600',
    popular: false,
    features: [
      '10 hashtag searches per month',
      '3 saved hashtag sets',
      'Basic analytics',
      'Instagram only',
      'Community support',
    ],
    limits: {
      searches: 10,
      sets: 3,
      competitors: 0,
      platforms: ['Instagram'],
      analytics: 'Basic',
      support: 'Community',
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Great for individual content creators',
    price: 19,
    period: 'month',
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    popular: true,
    features: [
      '200 hashtag searches per month',
      'Unlimited saved hashtag sets',
      'Advanced analytics & insights',
      'All platforms (Instagram, Twitter, TikTok)',
      'Competitor tracking (3 accounts)',
      'Trend alerts',
      'Priority support',
    ],
    limits: {
      searches: 200,
      sets: 'Unlimited',
      competitors: 3,
      platforms: ['Instagram', 'Twitter', 'TikTok', 'LinkedIn'],
      analytics: 'Advanced',
      support: 'Priority Email',
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal for agencies and power users',
    price: 49,
    period: 'month',
    icon: Crown,
    color: 'from-purple-500 to-purple-600',
    popular: false,
    features: [
      'Unlimited hashtag searches',
      'Unlimited saved hashtag sets',
      'Advanced analytics & reporting',
      'All platforms + API access',
      'Competitor tracking (15 accounts)',
      'Real-time trend monitoring',
      'Custom hashtag recommendations',
      'White-label reports',
      'Priority support + phone',
    ],
    limits: {
      searches: 'Unlimited',
      sets: 'Unlimited',
      competitors: 15,
      platforms: ['All platforms + API'],
      analytics: 'Advanced + Reports',
      support: 'Priority + Phone',
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For teams and growing businesses',
    price: 99,
    period: 'month',
    icon: Building,
    color: 'from-green-500 to-green-600',
    popular: false,
    features: [
      'Everything in Professional',
      'Team collaboration (5 users)',
      'Advanced team analytics',
      'Custom integrations',
      'Competitor tracking (50 accounts)',
      'Dedicated account manager',
      'Custom training sessions',
      'SLA guarantee (99.9% uptime)',
    ],
    limits: {
      searches: 'Unlimited',
      sets: 'Unlimited',
      competitors: 50,
      platforms: ['All platforms + API'],
      analytics: 'Team Analytics',
      support: 'Dedicated Manager',
    },
  },
];

const features = [
  'AI-powered hashtag discovery',
  'Real-time performance tracking',
  'Competitor analysis',
  'Multi-platform support',
  'Advanced analytics',
  'Export capabilities',
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Social Media Manager',
    company: 'TechStart Inc.',
    content: 'Increased our engagement by 340% in just 2 months!',
    rating: 5,
  },
  {
    name: 'Mike Rodriguez',
    role: 'Content Creator',
    company: '@miketravel',
    content: 'The AI recommendations are incredibly accurate.',
    rating: 5,
  },
];

export function LandingPricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (price: number) => {
    if (price === 0) return 'Free';
    const finalPrice = isAnnual ? Math.round(price * 0.8) : price;
    return `$${finalPrice}`;
  };

  const getSavings = (price: number) => {
    if (price === 0) return null;
    const savings = Math.round(price * 12 * 0.2);
    return isAnnual ? `Save $${savings}/year` : null;
  };

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="px-4 py-2">
            <Star className="mr-2 h-4 w-4" />
            Simple Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Choose the Perfect
            <span className="gradient-text"> Plan for You</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Start free, scale as you grow. All plans include core hashtag research 
            features with no hidden fees.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          <span className={`text-sm ${!isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAnnual ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
            Annual
          </span>
          {isAnnual && (
            <Badge variant="success" className="ml-2">
              Save 20%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                  : 'glass-card hover:shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center space-y-4 mb-6">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.color}`}>
                  <plan.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-bold">
                    {getPrice(plan.price)}
                    {plan.price > 0 && (
                      <span className="text-lg text-muted-foreground font-normal">
                        /{isAnnual ? 'year' : plan.period}
                      </span>
                    )}
                  </div>
                  {getSavings(plan.price) && (
                    <p className="text-sm text-green-600 font-medium">
                      {getSavings(plan.price)}
                    </p>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start space-x-3">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                asChild
                variant={plan.popular ? 'gradient' : 'outline'}
                className="w-full"
                size="lg"
              >
                <Link href={plan.price === 0 ? '/auth/signup' : `/checkout?plan=${plan.id}`}>
                  {plan.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {plan.price > 0 && (
                <p className="text-xs text-center text-muted-foreground mt-3">
                  14-day free trial • No credit card required
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">All Plans Include</h3>
            <p className="text-muted-foreground">
              Core features available across all subscription tiers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 glass-card rounded-lg">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-16 text-center space-y-8">
          <h3 className="text-2xl font-bold">Trusted by 50,000+ Users</h3>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-6 glass-card rounded-xl">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center space-y-6">
          <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
          
          <div className="max-w-3xl mx-auto space-y-4 text-left">
            <details className="p-4 glass-card rounded-lg">
              <summary className="font-medium cursor-pointer">
                Can I switch plans anytime?
              </summary>
              <p className="mt-2 text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. 
                Changes take effect immediately and we'll prorate your billing.
              </p>
            </details>
            
            <details className="p-4 glass-card rounded-lg">
              <summary className="font-medium cursor-pointer">
                What happens to my data if I cancel?
              </summary>
              <p className="mt-2 text-muted-foreground">
                Your data remains accessible for 30 days after cancellation. 
                You can export all your hashtag sets and analytics at any time.
              </p>
            </details>
            
            <details className="p-4 glass-card rounded-lg">
              <summary className="font-medium cursor-pointer">
                Do you offer refunds?
              </summary>
              <p className="mt-2 text-muted-foreground">
                We offer a 30-day money-back guarantee for all paid plans. 
                Contact support if you're not completely satisfied.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}