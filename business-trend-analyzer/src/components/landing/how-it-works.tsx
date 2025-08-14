import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Database, Brain, Target, Zap } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    step: '01',
    icon: Database,
    title: 'Connect Your Data',
    description: 'Easily connect your business systems like QuickBooks, Shopify, Google Analytics, or upload CSV files. Our platform automatically maps and syncs your data.',
    features: ['One-click integrations', 'Automatic data mapping', 'Real-time sync', 'Secure connections']
  },
  {
    step: '02',
    icon: Brain,
    title: 'AI Analyzes Patterns',
    description: 'Our advanced AI algorithms automatically analyze your historical data to identify trends, seasonality, correlations, and anomalies across all your metrics.',
    features: ['Pattern recognition', 'Anomaly detection', 'Correlation analysis', 'Seasonal trends']
  },
  {
    step: '03',
    icon: Target,
    title: 'Get Actionable Insights',
    description: 'Receive clear, prioritized insights in plain English with specific recommendations on what actions to take to improve your business performance.',
    features: ['Plain English insights', 'Priority scoring', 'Action recommendations', 'Impact estimates']
  },
  {
    step: '04',
    icon: Zap,
    title: 'Make Data-Driven Decisions',
    description: 'Use predictions and insights to make informed decisions, track the results, and continuously improve your business strategy with real-time feedback.',
    features: ['Future predictions', 'Decision tracking', 'Success measurement', 'Continuous learning']
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            <Target className="h-4 w-4" />
            <span>How It Works</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            From data to insights in{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              4 simple steps
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform is designed to be simple yet powerful. Get started in minutes 
            and start receiving insights that transform your business decisions.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 lg:space-y-12">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isEven = index % 2 === 1
            
            return (
              <div 
                key={index} 
                className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                  isEven ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Content */}
                <div className={`space-y-6 ${isEven ? 'lg:order-2' : ''}`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-lg">
                      {step.step}
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl md:text-3xl font-bold">{step.title}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {step.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Connection Arrow for non-last items */}
                  {index < steps.length - 1 && (
                    <div className="flex lg:hidden justify-center pt-8">
                      <ArrowRight className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>

                {/* Visual */}
                <div className={`relative ${isEven ? 'lg:order-1' : ''}`}>
                  <Card className="border-0 shadow-xl">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Step {step.step}</CardTitle>
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Mock interface based on step */}
                      {index === 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                              <Database className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">QuickBooks Connected</div>
                              <div className="text-xs text-muted-foreground">Last sync: 2 min ago</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                              <Database className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Shopify Connected</div>
                              <div className="text-xs text-muted-foreground">Last sync: 5 min ago</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {index === 1 && (
                        <div className="space-y-3">
                          <div className="h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-pulse" />
                          <div className="h-3 bg-gradient-to-r from-green-200 to-blue-200 rounded animate-pulse" />
                          <div className="text-center py-4">
                            <Brain className="h-8 w-8 mx-auto text-primary animate-pulse" />
                            <div className="text-sm text-muted-foreground mt-2">AI analyzing patterns...</div>
                          </div>
                        </div>
                      )}

                      {index === 2 && (
                        <div className="space-y-3">
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border-l-4 border-orange-500">
                            <div className="font-medium text-sm">Revenue Growth Opportunity</div>
                            <div className="text-xs text-muted-foreground">High Priority • Impact: +15%</div>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border-l-4 border-green-500">
                            <div className="font-medium text-sm">Seasonal Trend Detected</div>
                            <div className="text-xs text-muted-foreground">Medium Priority • Q4 Boost</div>
                          </div>
                        </div>
                      )}

                      {index === 3 && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-primary/10 rounded-lg">
                              <div className="text-lg font-bold text-primary">+24%</div>
                              <div className="text-xs text-muted-foreground">Revenue Growth</div>
                            </div>
                            <div className="text-center p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                              <div className="text-lg font-bold text-green-600">95%</div>
                              <div className="text-xs text-muted-foreground">Accuracy Rate</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Desktop Arrow */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                      <ArrowRight className="h-8 w-8 text-primary rotate-90" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            Free 14-day trial • No credit card required • Setup in 5 minutes
          </p>
        </div>
      </div>
    </section>
  )
}