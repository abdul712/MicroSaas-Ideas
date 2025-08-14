'use client'

import { Card, CardContent } from '@/components/ui/card'
import { 
  Map, 
  BarChart3, 
  Brain, 
  Zap, 
  Shield, 
  Workflow,
  Eye,
  Target,
  Users,
  TrendingUp,
  Globe,
  Smartphone
} from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      icon: Map,
      title: 'Visual Journey Mapping',
      description: 'Create interactive, drag-and-drop journey maps that visualize every customer touchpoint across all channels.',
      color: 'bg-blue-500'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Get instant insights with live data processing. Track user behavior as it happens across your entire funnel.',
      color: 'bg-green-500'
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Discover optimization opportunities with machine learning algorithms that analyze user patterns and predict outcomes.',
      color: 'bg-purple-500'
    },
    {
      icon: Zap,
      title: 'Lightning Setup',
      description: 'Get started in minutes with our one-line JavaScript SDK and pre-built integrations for popular platforms.',
      color: 'bg-yellow-500'
    },
    {
      icon: Shield,
      title: 'Privacy Compliant',
      description: 'Built-in GDPR and CCPA compliance with data anonymization, consent management, and user privacy controls.',
      color: 'bg-red-500'
    },
    {
      icon: Workflow,
      title: 'Advanced Funnels',
      description: 'Create complex conversion funnels with branching paths, cohort analysis, and attribution modeling.',
      color: 'bg-indigo-500'
    }
  ]

  const capabilities = [
    {
      icon: Eye,
      title: 'Cross-Device Tracking',
      description: 'Follow users across devices and sessions to understand the complete customer journey.'
    },
    {
      icon: Target,
      title: 'Conversion Optimization',
      description: 'Identify bottlenecks and optimize touchpoints to increase conversion rates by up to 30%.'
    },
    {
      icon: Users,
      title: 'Customer Segmentation',
      description: 'Create dynamic segments and compare journey performance across different user groups.'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Analytics',
      description: 'Forecast user behavior and identify high-value customers before they convert.'
    },
    {
      icon: Globe,
      title: 'Multi-Channel Support',
      description: 'Track interactions across web, mobile, email, social media, and offline touchpoints.'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description: 'Optimized for mobile with responsive dashboards and touch-friendly journey builders.'
    }
  ]

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to optimize customer journeys
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From visual mapping to AI-powered insights, our platform provides all the tools 
            you need to understand and improve your customer experience.
          </p>
        </div>

        {/* Main features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Capabilities section */}
        <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Advanced Capabilities
            </h3>
            <p className="text-lg text-gray-600">
              Go beyond basic analytics with enterprise-grade features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((capability, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <capability.icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {capability.title}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration showcase */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Integrates with your favorite tools
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {[
              'Google Analytics',
              'Shopify',
              'Salesforce',
              'HubSpot',
              'Stripe',
              'Mailchimp',
              'Slack',
              'Zapier'
            ].map((integration, index) => (
              <div key={index} className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium text-gray-700">
                {integration}
              </div>
            ))}
          </div>
          <p className="text-gray-600 mt-6">
            + 100+ more integrations via API and webhooks
          </p>
        </div>
      </div>
    </section>
  )
}