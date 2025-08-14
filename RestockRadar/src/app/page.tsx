import Link from 'next/link'
import { ArrowRight, BarChart3, Bot, Zap, Shield, Globe, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-brand-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                  RestockRadar
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Features
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Pricing
              </Link>
              <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Docs
              </Link>
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-brand-50 to-white dark:from-brand-950 dark:to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              AI-Powered Inventory Management
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Never Run Out of Stock{' '}
              <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                Again
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Enterprise-grade inventory management with AI-powered demand forecasting, automated reordering, 
              and real-time multi-channel synchronization. Optimize your stock levels and boost profitability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                <Link href="/demo">Watch Demo</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              14-day free trial • No credit card required • Setup in 5 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Intelligent Inventory Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced features powered by machine learning to optimize your inventory operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-brand-600" />
                </div>
                <CardTitle>AI-Powered Forecasting</CardTitle>
                <CardDescription>
                  Machine learning algorithms predict demand patterns, seasonal trends, and optimal stock levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• 85%+ forecasting accuracy</li>
                  <li>• Seasonal pattern recognition</li>
                  <li>• External factor integration</li>
                  <li>• Continuous model improvement</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-success-600" />
                </div>
                <CardTitle>Automated Reordering</CardTitle>
                <CardDescription>
                  Intelligent purchase order generation with supplier management and cost optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Smart reorder point calculation</li>
                  <li>• Automatic PO generation</li>
                  <li>• Supplier performance tracking</li>
                  <li>• Cost optimization algorithms</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-warning-600" />
                </div>
                <CardTitle>Multi-Channel Sync</CardTitle>
                <CardDescription>
                  Real-time inventory synchronization across all your sales channels and platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Shopify, Amazon, eBay integration</li>
                  <li>• Real-time inventory updates</li>
                  <li>• Multi-location support</li>
                  <li>• Webhook-based synchronization</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Comprehensive reporting and business intelligence for data-driven decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Real-time dashboard</li>
                  <li>• Custom report builder</li>
                  <li>• Profitability analysis</li>
                  <li>• Performance metrics</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-level security with data encryption, compliance, and audit trails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• End-to-end encryption</li>
                  <li>• GDPR compliance</li>
                  <li>• Role-based access control</li>
                  <li>• Complete audit logging</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Business Growth</CardTitle>
                <CardDescription>
                  Scale your operations with enterprise-grade infrastructure and support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Auto-scaling infrastructure</li>
                  <li>• 99.9% uptime guarantee</li>
                  <li>• 24/7 expert support</li>
                  <li>• Custom integrations</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Proven Results
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of businesses optimizing their inventory
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-600 mb-2">85%</div>
              <div className="text-muted-foreground">Forecast Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-success-600 mb-2">30%</div>
              <div className="text-muted-foreground">Inventory Cost Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-warning-600 mb-2">95%</div>
              <div className="text-muted-foreground">Stockout Prevention</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">50%</div>
              <div className="text-muted-foreground">Time Saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-brand-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Optimize Your Inventory?
            </h2>
            <p className="text-xl text-brand-100 mb-8 max-w-2xl mx-auto">
              Start your free 14-day trial today and experience the power of AI-driven inventory management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
                <Link href="/auth/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white hover:bg-white hover:text-brand-600" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <Bot className="h-6 w-6 text-brand-600" />
                <span className="text-lg font-bold">RestockRadar</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                AI-powered inventory management platform for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-foreground">Integrations</Link></li>
                <li><Link href="/api" className="hover:text-foreground">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/status" className="hover:text-foreground">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 RestockRadar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}