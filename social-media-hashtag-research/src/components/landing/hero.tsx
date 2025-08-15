'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Hash, 
  TrendingUp, 
  Target, 
  Zap,
  Search,
  BarChart3,
  Instagram,
  Twitter
} from 'lucide-react'
import { signIn } from 'next-auth/react'

export function Hero() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [demoResults, setDemoResults] = useState<any[]>([])

  const handleDemoSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    
    // Demo data for illustration
    setTimeout(() => {
      const mockResults = [
        {
          tag: searchQuery.toLowerCase(),
          posts: '2.3M',
          engagement: '4.2%',
          difficulty: 'Medium',
          trend: '+15%',
          score: 87
        },
        {
          tag: `${searchQuery.toLowerCase()}daily`,
          posts: '850K',
          engagement: '5.8%',
          difficulty: 'Easy',
          trend: '+23%',
          score: 92
        },
        {
          tag: `${searchQuery.toLowerCase()}life`,
          posts: '1.8M',
          engagement: '3.9%',
          difficulty: 'Hard',
          trend: '+8%',
          score: 76
        }
      ]
      setDemoResults(mockResults)
      setIsSearching(false)
    }, 1500)
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900 pt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Hashtag Research
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Boost Your
              <span className="text-gradient block">Social Media Reach</span>
              with Smart Hashtags
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
              Discover trending hashtags, analyze competition, and get AI-powered recommendations 
              to maximize your content's visibility across all social platforms.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">50M+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Hashtags Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">95%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-pink-600">10K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Happy Users</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={() => signIn()} className="text-lg px-8 py-3">
                Start Free Research
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Instagram className="w-5 h-5" />
                <span>Instagram</span>
              </div>
              <div className="flex items-center space-x-2">
                <Twitter className="w-5 h-5" />
                <span>Twitter</span>
              </div>
              <div className="flex items-center space-x-2">
                <Hash className="w-5 h-5" />
                <span>TikTok</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>LinkedIn</span>
              </div>
            </div>
          </div>

          {/* Right Column - Interactive Demo */}
          <div className="relative">
            <Card className="p-6 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Try it now - Free Demo</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Search for any topic to see hashtag recommendations
                </p>
              </div>

              {/* Search Input */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="e.g., fitness, travel, food..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleDemoSearch()}
                  />
                </div>
                <Button onClick={handleDemoSearch} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {/* Demo Results */}
              {isSearching && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              )}

              {demoResults.length > 0 && !isSearching && (
                <div className="space-y-3">
                  {demoResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Hash className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium">#{result.tag}</div>
                          <div className="text-sm text-gray-500">
                            {result.posts} posts • {result.engagement} avg engagement
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={result.difficulty === 'Easy' ? 'default' : result.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                          {result.difficulty}
                        </Badge>
                        <div className="text-sm text-green-600 font-medium mt-1">
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          {result.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-3 border-t border-gray-200 dark:border-gray-600">
                    <Button variant="outline" size="sm" onClick={() => signIn()}>
                      Get Full Analysis
                    </Button>
                  </div>
                </div>
              )}

              {demoResults.length === 0 && !isSearching && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Enter a topic above to see hashtag suggestions</p>
                </div>
              )}
            </Card>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Hash className="w-8 h-8 text-blue-600" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}