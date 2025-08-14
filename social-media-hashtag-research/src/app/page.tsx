import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, TrendingUp, Users, BarChart3, Hash, Zap, Shield, Globe } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Hash className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                HashtagPro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/20 rounded-full text-purple-800 dark:text-purple-200 text-sm font-medium mb-8">
            <Zap className="h-4 w-4 mr-2" />
            AI-Powered Hashtag Research
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Discover Hashtags
            <br />
            That Drive Results
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Find trending hashtags, analyze competitors, and optimize your social media reach with 
            AI-powered insights. Get discovered by the right audience, every time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Free Research
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: '10M+', label: 'Hashtags Analyzed' },
              { number: '5+', label: 'Platforms Supported' },
              { number: '95%', label: 'Accuracy Rate' },
              { number: '24/7', label: 'Real-time Updates' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.number}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to Dominate Social Media
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From hashtag discovery to competitor analysis, we provide all the tools 
              you need to maximize your social media impact.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="h-8 w-8" />,
                title: 'Smart Hashtag Discovery',
                description: 'Find the perfect mix of trending, niche, and competitive hashtags using AI-powered recommendations.',
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: 'Real-time Trend Analysis',
                description: 'Stay ahead of the curve with real-time trending hashtag detection and performance insights.',
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: 'Competitor Intelligence',
                description: 'Analyze competitor hashtag strategies and discover what drives their engagement.',
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: 'Performance Analytics',
                description: 'Track hashtag performance over time and optimize your strategy with detailed analytics.',
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: 'Multi-Platform Support',
                description: 'Optimize for Instagram, Twitter, LinkedIn, TikTok, and more with platform-specific insights.',
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Enterprise Security',
                description: 'Bank-level security with GDPR compliance and enterprise-grade data protection.',
              },
            ].map((feature, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-primary mb-2 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Optimize for Every Platform
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get platform-specific hashtag recommendations that work across all major social networks.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Instagram', color: 'from-purple-400 to-pink-400' },
              { name: 'Twitter', color: 'from-blue-400 to-blue-600' },
              { name: 'LinkedIn', color: 'from-blue-600 to-blue-800' },
              { name: 'TikTok', color: 'from-gray-800 to-black' },
              { name: 'Facebook', color: 'from-blue-500 to-blue-700' },
              { name: 'YouTube', color: 'from-red-500 to-red-700' },
            ].map((platform, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${platform.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {platform.name[0]}
                </div>
                <div className="font-medium">{platform.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to 10x Your Social Media Reach?
          </h2>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto mb-8">
            Join thousands of creators and businesses who use HashtagPro to discover 
            the hashtags that drive real results.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Hash className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">HashtagPro</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 HashtagPro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}