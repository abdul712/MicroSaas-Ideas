import { 
  Bot, 
  Eye, 
  TrendingUp, 
  Bell, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe, 
  Users 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Eye,
    title: 'Automated Competitor Monitoring',
    description: 'Track competitor websites, pricing, products, and marketing campaigns 24/7 with intelligent web scraping.',
    badge: 'Core Feature',
    benefits: [
      'Website change detection',
      'Price monitoring & alerts', 
      'Product launch tracking',
      'Social media surveillance'
    ]
  },
  {
    icon: Bot,
    title: 'AI-Powered Market Intelligence',
    description: 'Advanced AI analyzes competitive data to identify trends, opportunities, and strategic recommendations.',
    badge: 'AI-Powered',
    benefits: [
      'Sentiment analysis',
      'Market trend prediction',
      'Competitive gap analysis',
      'Strategy recommendations'
    ]
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics Dashboard',
    description: 'Comprehensive dashboards with interactive charts, competitor comparisons, and market insights.',
    badge: 'Analytics',
    benefits: [
      'Interactive visualizations',
      'Competitor benchmarking',
      'Market share analysis',
      'Custom KPI tracking'
    ]
  },
  {
    icon: Bell,
    title: 'Smart Alert System',
    description: 'Customizable alerts for competitor activities, price changes, and market opportunities.',
    badge: 'Automation',
    benefits: [
      'Custom alert rules',
      'Multi-channel notifications',
      'Priority-based filtering',
      'Team collaboration'
    ]
  },
  {
    icon: TrendingUp,
    title: 'Strategic Insights Engine',
    description: 'Transform raw competitive data into actionable business intelligence and strategic recommendations.',
    badge: 'Intelligence',
    benefits: [
      'Opportunity identification',
      'Threat assessment',
      'Market positioning',
      'Strategic planning'
    ]
  },
  {
    icon: Shield,
    title: 'Enterprise Security & Compliance',
    description: 'Bank-grade security with GDPR compliance, audit logging, and ethical data collection practices.',
    badge: 'Security',
    benefits: [
      'Data encryption',
      'GDPR compliance',
      'Audit trails',
      'Ethical scraping'
    ]
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share insights, collaborate on analysis, and align your team with competitive intelligence.',
    badge: 'Collaboration',
    benefits: [
      'Team workspaces',
      'Shared dashboards',
      'Comment & annotations',
      'Role-based access'
    ]
  },
  {
    icon: Zap,
    title: 'API-First Architecture',
    description: 'Comprehensive REST APIs for integrations with your existing tools and custom applications.',
    badge: 'Integration',
    benefits: [
      'RESTful APIs',
      'Webhook support',
      'Third-party integrations',
      'Developer portal'
    ]
  },
  {
    icon: Globe,
    title: 'Global Market Coverage',
    description: 'Monitor competitors across multiple markets, regions, and languages with localized insights.',
    badge: 'Global',
    benefits: [
      'Multi-region support',
      'Language detection',
      'Local market insights',
      'Currency conversion'
    ]
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-secondary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            🔥 Powerful Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-6">
            Everything you need for
            <span className="gradient-text"> competitive intelligence</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From automated monitoring to AI-powered insights, our platform provides 
            comprehensive competitive intelligence for modern businesses.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card 
                key={feature.title}
                className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to see these features in action?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Badge variant="secondary" className="px-4 py-2">
              🚀 14-day free trial
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              💳 No credit card required
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              📞 24/7 support included
            </Badge>
          </div>
        </div>
      </div>
    </section>
  )
}