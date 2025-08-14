'use client'

import { useState } from 'react'
import { Search, Shield, Zap, TrendingUp, BarChart3, Users, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isValidUrl } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function LandingPage() {
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to analyze.",
        variant: "destructive",
      })
      return
    }

    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (including http:// or https://)",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()
      
      // Redirect to results page
      window.location.href = `/analysis/${result.id}`
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the URL. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const features = [
    {
      icon: Search,
      title: "Technical SEO Audit",
      description: "Comprehensive analysis of meta tags, headers, URL structure, and technical SEO factors.",
      color: "text-blue-600",
    },
    {
      icon: BarChart3,
      title: "Content Analysis",
      description: "Keyword density, readability scoring, content structure optimization recommendations.",
      color: "text-green-600",
    },
    {
      icon: TrendingUp,
      title: "Keyword Research",
      description: "Discover high-value keywords, track rankings, and identify content opportunities.",
      color: "text-purple-600",
    },
    {
      icon: Zap,
      title: "Performance Metrics",
      description: "Core Web Vitals analysis, page speed optimization, and mobile-friendliness testing.",
      color: "text-yellow-600",
    },
    {
      icon: Users,
      title: "Competitor Analysis",
      description: "Compare your SEO performance against competitors and find content gaps.",
      color: "text-red-600",
    },
    {
      icon: Shield,
      title: "SEO Recommendations",
      description: "Prioritized, actionable recommendations with step-by-step implementation guides.",
      color: "text-indigo-600",
    },
  ]

  const benefits = [
    "Increase organic traffic by up to 300%",
    "Improve search rankings within 30 days",
    "Identify and fix technical SEO issues",
    "Optimize content for better engagement",
    "Monitor competitor SEO strategies",
    "Track keyword performance over time",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">SEO Checker</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-primary transition-colors">Pricing</a>
            <a href="#about" className="text-gray-600 hover:text-primary transition-colors">About</a>
            <Button variant="outline" size="sm">Sign In</Button>
            <Button size="sm">Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            🚀 Professional SEO Analysis Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
            Comprehensive SEO Analysis & Optimization Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get real-time SEO audits, keyword optimization, content scoring, and automated improvements 
            for your blog and content websites. Boost your search rankings with professional-grade analysis.
          </p>

          {/* SEO Analysis Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 glass-effect">
            <h2 className="text-2xl font-semibold mb-4">Analyze Your Website</h2>
            <p className="text-gray-600 mb-6">Enter your URL to get a comprehensive SEO analysis in seconds</p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <Input
                type="url"
                placeholder="https://your-website.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 h-12 text-lg"
                disabled={isAnalyzing}
              />
              <Button 
                onClick={handleAnalyze}
                loading={isAnalyzing}
                size="lg"
                className="h-12 px-8"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze SEO'}
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Technical SEO Audit
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Content Analysis
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Performance Testing
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Keyword Research
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">3000+</div>
              <div className="text-gray-600">Websites Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50%</div>
              <div className="text-gray-600">Average SEO Improvement</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">< 5min</div>
              <div className="text-gray-600">Analysis Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful SEO Analysis Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to optimize your website for search engines and improve your rankings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
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

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose Our SEO Platform?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Get professional-grade SEO analysis and optimization recommendations 
                that help you outrank your competitors and drive more organic traffic.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button size="lg" className="mr-4">
                  Start Free Analysis
                </Button>
                <Button variant="outline" size="lg">
                  View Demo
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">SEO Score</span>
                    <Badge variant="excellent">Excellent</Badge>
                  </div>
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out" 
                         style={{ width: '92%' }}></div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-600">92</span>
                    <span className="text-gray-500">/100</span>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Technical SEO</span>
                      <span className="font-medium">95/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Content Quality</span>
                      <span className="font-medium">88/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Performance</span>
                      <span className="font-medium">94/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Keywords</span>
                      <span className="font-medium">91/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Boost Your SEO?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Start your free SEO analysis today and discover how to improve your search rankings
          </p>
          <Button size="lg" variant="secondary" className="text-primary">
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-6 w-6" />
                <span className="text-xl font-bold">SEO Checker</span>
              </div>
              <p className="text-gray-400">
                Professional SEO analysis platform for blogs and content websites.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>SEO Audit</li>
                <li>Keyword Research</li>
                <li>Content Analysis</li>
                <li>Performance Testing</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Contact Support</li>
                <li>API Reference</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SEO Checker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}