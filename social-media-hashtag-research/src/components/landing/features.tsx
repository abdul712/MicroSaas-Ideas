'use client';

import { 
  Search, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Users, 
  Zap,
  Hash,
  Eye,
  Clock,
  Shield,
  Sparkles,
  Bot
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Search,
    title: 'Smart Hashtag Discovery',
    description: 'AI-powered search engine finds the most relevant hashtags for your niche with real-time performance data.',
    benefits: ['10x faster research', 'Real-time data', 'Niche-specific results'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: TrendingUp,
    title: 'Trend Analysis & Forecasting',
    description: 'Stay ahead of the curve with trending hashtag detection and performance predictions.',
    benefits: ['Spot trends early', 'Predict performance', 'Seasonal insights'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Target,
    title: 'Competition Analysis',
    description: 'Analyze competitor hashtag strategies and discover what works in your industry.',
    benefits: ['Competitor insights', 'Strategy analysis', 'Gap identification'],
    color: 'from-purple-500 to-violet-500'
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Track hashtag performance with detailed metrics and actionable insights.',
    benefits: ['ROI tracking', 'Engagement metrics', 'Performance reports'],
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: Bot,
    title: 'AI Recommendations',
    description: 'Get personalized hashtag suggestions based on your content and audience.',
    benefits: ['Personalized suggestions', 'Content analysis', 'Optimal mix ratios'],
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: Zap,
    title: 'Instant Hashtag Sets',
    description: 'Generate optimized hashtag combinations with one click, ready to copy and paste.',
    benefits: ['One-click generation', 'Optimized combinations', 'Copy-ready format'],
    color: 'from-indigo-500 to-purple-500'
  }
];

const platforms = [
  { name: 'Instagram', users: '2B+', growth: '+12%', color: 'from-purple-500 to-pink-500' },
  { name: 'Twitter', users: '450M+', growth: '+8%', color: 'from-blue-400 to-blue-600' },
  { name: 'TikTok', users: '1B+', growth: '+25%', color: 'from-black to-gray-800' },
  { name: 'LinkedIn', users: '900M+', growth: '+15%', color: 'from-blue-600 to-blue-800' },
];

const stats = [
  { icon: Hash, value: '2.5M+', label: 'Hashtags Analyzed' },
  { icon: Eye, value: '340%', label: 'Avg. Engagement Boost' },
  { icon: Users, value: '50K+', label: 'Active Users' },
  { icon: Clock, value: '< 1s', label: 'Search Speed' },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="px-4 py-2">
            <Sparkles className="mr-2 h-4 w-4" />
            Powerful Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Everything You Need for
            <span className="gradient-text"> Hashtag Success</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Our AI-powered platform combines advanced analytics, real-time data, 
            and intelligent recommendations to maximize your social media reach.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 glass-card rounded-xl">
              <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="group p-6 glass-card rounded-xl hover:shadow-lg transition-all duration-300">
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground mb-4">{feature.description}</p>
              
              <div className="space-y-2">
                {feature.benefits.map((benefit, benefitIndex) => (
                  <div key={benefitIndex} className="flex items-center text-sm">
                    <div className="w-1 h-1 rounded-full bg-green-500 mr-2" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Platform Support */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Supported Platforms</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get hashtag insights across all major social media platforms 
              with unified analytics and cross-platform optimization.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {platforms.map((platform, index) => (
              <div key={index} className="p-6 glass-card rounded-xl text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">
                    {platform.name.charAt(0)}
                  </span>
                </div>
                <h4 className="font-semibold mb-2">{platform.name}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>{platform.users} users</div>
                  <div className="text-green-600">
                    {platform.growth} growth
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlight */}
        <div className="mt-16 p-8 gradient-bg rounded-2xl">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold">Enterprise-Grade Security</h3>
            <p className="max-w-2xl mx-auto text-muted-foreground">
              Your data is protected with bank-level encryption, GDPR compliance, 
              and secure API integrations. We never store your social media credentials.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Badge variant="secondary">SOC 2 Compliant</Badge>
              <Badge variant="secondary">GDPR Ready</Badge>
              <Badge variant="secondary">256-bit SSL</Badge>
              <Badge variant="secondary">99.9% Uptime</Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}