import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TrendingUp, BarChart3, Zap, Shield } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                <Zap className="h-4 w-4" />
                <span>AI-Powered Market Intelligence</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                See the{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Future
                </span>{' '}
                of Your Business
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Transform your business data into strategic advantages with AI-powered trend analysis. 
                Spot opportunities, predict market shifts, and stay ahead of competitors with actionable insights.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>95% Accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Real-time Analysis</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border">
              {/* Mock Dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Revenue Trend Analysis</h3>
                  <div className="flex items-center space-x-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+24.5%</span>
                  </div>
                </div>
                
                {/* Chart Placeholder */}
                <div className="h-48 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Interactive trend visualization</p>
                  </div>
                </div>
                
                {/* Key Insights */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">OPPORTUNITY</p>
                    <p className="text-sm text-green-900 dark:text-green-300">Q4 shows strong growth potential</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">PREDICTION</p>
                    <p className="text-sm text-blue-900 dark:text-blue-300">15% increase next month</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg">
              <div className="text-xs font-medium">LIVE INSIGHT</div>
              <div className="text-sm">New trend detected</div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white p-3 rounded-lg shadow-lg">
              <div className="text-xs font-medium">AI PREDICTION</div>
              <div className="text-sm">95% confidence</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}