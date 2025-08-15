'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MousePointer, 
  Eye, 
  Scroll, 
  Users, 
  Shield, 
  Zap, 
  Brain, 
  BarChart3, 
  Globe,
  Lock,
  Smartphone,
  Timer
} from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: MousePointer,
    title: 'Click Heatmaps',
    description: 'Visualize where users click most frequently with color-coded intensity maps.',
    category: 'Analytics',
    highlight: false,
  },
  {
    icon: Scroll,
    title: 'Scroll Maps',
    description: 'See how far users scroll and identify the optimal content length.',
    category: 'Analytics', 
    highlight: false,
  },
  {
    icon: Eye,
    title: 'Session Replay',
    description: 'Watch anonymized user sessions to understand behavior patterns.',
    category: 'Insights',
    highlight: true,
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get automated recommendations to improve user experience and conversions.',
    category: 'AI',
    highlight: true,
  },
  {
    icon: Users,
    title: 'User Journey Mapping',
    description: 'Track complete user flows and identify drop-off points.',
    category: 'Analytics',
    highlight: false,
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Monitor visitor behavior as it happens with live data updates.',
    category: 'Analytics',
    highlight: false,
  },
  {
    icon: Shield,
    title: 'Privacy-First Design',
    description: 'GDPR/CCPA compliant with automatic PII detection and masking.',
    category: 'Privacy',
    highlight: true,
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Sub-50ms tracking script load time with zero impact on site performance.',
    category: 'Performance',
    highlight: false,
  },
  {
    icon: Smartphone,
    title: 'Mobile Analytics',
    description: 'Touch gesture tracking and mobile-optimized heatmap visualization.',
    category: 'Mobile',
    highlight: false,
  },
  {
    icon: Globe,
    title: 'Global CDN',
    description: 'Worldwide content delivery for optimal tracking performance.',
    category: 'Performance',
    highlight: false,
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption and secure data handling.',
    category: 'Security',
    highlight: false,
  },
  {
    icon: Timer,
    title: 'Real-time Processing',
    description: 'Generate heatmaps in under 3 seconds with live data processing.',
    category: 'Performance',
    highlight: false,
  },
]

const categories = ['All', 'Analytics', 'AI', 'Privacy', 'Performance', 'Security', 'Mobile']

export function Features() {
  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container px-4 md:px-6">
        <motion.div
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="px-3 py-1">
            Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Everything you need to understand your users
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Comprehensive analytics platform with enterprise-grade features for businesses of all sizes.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                feature.highlight ? 'border-primary/50 bg-primary/5' : ''
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${
                      feature.highlight ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <feature.icon className={`h-6 w-6 ${
                        feature.highlight ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-8 border">
            <h3 className="text-2xl font-bold mb-4">Ready to see your website through your users' eyes?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of businesses using our platform to optimize their websites and increase conversions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Badge variant="outline" className="px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Setup in 2 minutes
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                GDPR Compliant
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Timer className="w-4 h-4 mr-2" />
                Real-time data
              </Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}