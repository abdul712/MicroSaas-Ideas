import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Hash, 
  TrendingUp, 
  Target, 
  BarChart3,
  Zap,
  Shield,
  Globe,
  Users,
  Clock
} from 'lucide-react'

const features = [
  {
    icon: Hash,
    title: 'AI-Powered Hashtag Discovery',
    description: 'Our advanced AI analyzes millions of posts to suggest the most effective hashtags for your content and niche.',
    gradient: 'from-blue-500 to-purple-600'
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Trending Analysis',
    description: 'Stay ahead of trends with live hashtag performance tracking and emerging topic detection across all platforms.',
    gradient: 'from-green-500 to-teal-600'
  },
  {
    icon: Target,
    title: 'Competitor Intelligence',
    description: 'Analyze your competitors\' hashtag strategies and discover what\'s driving their engagement and growth.',
    gradient: 'from-orange-500 to-red-600'
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Track your hashtag performance with detailed metrics, engagement rates, and reach optimization insights.',
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    icon: Zap,
    title: 'Smart Recommendations',
    description: 'Get personalized hashtag suggestions based on your content, audience, and engagement goals.',
    gradient: 'from-yellow-500 to-orange-600'
  },
  {
    icon: Shield,
    title: 'Content Safety Check',
    description: 'Ensure your hashtags are safe and appropriate with our automated content moderation system.',
    gradient: 'from-indigo-500 to-blue-600'
  },
  {
    icon: Globe,
    title: 'Multi-Platform Support',
    description: 'Research hashtags across Instagram, Twitter, TikTok, LinkedIn, and more - all from one dashboard.',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share hashtag sets, collaborate on strategies, and manage multiple accounts with your team.',
    gradient: 'from-rose-500 to-pink-600'
  },
  {
    icon: Clock,
    title: 'Optimal Timing Insights',
    description: 'Discover the best times to use specific hashtags for maximum reach and engagement.',
    gradient: 'from-emerald-500 to-green-600'
  }
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need for
            <span className="text-gradient block">Hashtag Success</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Powerful features designed to help content creators, marketers, and businesses 
            maximize their social media reach and engagement.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-800 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-800 dark:text-blue-200 text-sm font-medium">
            <Zap className="w-4 h-4 mr-2" />
            And much more coming soon...
          </div>
        </div>
      </div>
    </section>
  )
}