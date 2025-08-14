import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  Brain, 
  Zap, 
  Shield, 
  BarChart3, 
  AlertTriangle, 
  Target, 
  Smartphone,
  Clock,
  Users
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Pattern Recognition',
    description: 'Advanced machine learning algorithms automatically detect trends, patterns, and anomalies in your business data without any manual setup.'
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: 'Forecast future trends, revenue, and market opportunities with 95% accuracy using our sophisticated prediction models.'
  },
  {
    icon: Zap,
    title: 'Real-time Insights',
    description: 'Get instant notifications about significant changes in your business metrics and emerging opportunities as they happen.'
  },
  {
    icon: BarChart3,
    title: 'Interactive Dashboards',
    description: 'Beautiful, customizable dashboards that make complex data easy to understand with drag-and-drop visualizations.'
  },
  {
    icon: AlertTriangle,
    title: 'Early Warning System',
    description: 'Detect potential risks and market disruptions before they impact your business with our advanced anomaly detection.'
  },
  {
    icon: Target,
    title: 'Actionable Recommendations',
    description: 'Receive specific, prioritized recommendations on what actions to take based on your data insights and predictions.'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, SOC 2 compliance, and advanced security measures to protect your sensitive business data.'
  },
  {
    icon: Smartphone,
    title: 'Multi-Platform Access',
    description: 'Access your insights anywhere with responsive web app, mobile apps, and API integrations for seamless workflow.'
  },
  {
    icon: Clock,
    title: 'Automated Reporting',
    description: 'Schedule and automatically generate comprehensive reports for stakeholders with customizable formats and delivery.'
  }
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            <Users className="h-4 w-4" />
            <span>Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              stay ahead
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive platform combines cutting-edge AI with intuitive design 
            to give you the competitive advantage you need in today's fast-moving market.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Feature Highlight */}
        <div className="mt-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-2xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold">
                Transform Data Into Strategic Advantage
              </h3>
              <p className="text-lg text-muted-foreground">
                Stop making decisions based on gut feeling. Our AI analyzes patterns across all your business data 
                to provide insights that drive growth, reduce risks, and identify opportunities before your competitors.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-2xl font-bold text-primary">95%</div>
                  <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Real-time Monitoring</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Data Integrations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">5min</div>
                  <div className="text-sm text-muted-foreground">Setup Time</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Market Opportunity Score</span>
                    <span className="text-green-600 font-bold">92/100</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: '92%' }} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    AI detected a 92% probability of market expansion in Q4
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}