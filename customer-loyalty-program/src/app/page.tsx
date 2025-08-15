import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Gift, 
  TrendingUp, 
  Users, 
  Smartphone, 
  BarChart3, 
  Shield, 
  Zap,
  Star,
  Heart,
  Trophy,
  Sparkles
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              LoyaltyMax
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-purple-600 transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-gray-600 hover:text-purple-600 transition-colors">
              Login
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Build Customer Loyalty That Lasts
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Reward Loyalty,<br />
            Grow Revenue
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create digital loyalty programs that turn one-time customers into lifelong fans. 
            No expensive hardware, no complicated setup. Just results.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-6 text-lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-purple-200 hover:border-purple-300">
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              <span>2,000+ Businesses</span>
            </div>
            <div className="flex items-center">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              <span>1M+ Happy Customers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Build Loyalty</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to increase customer retention and drive repeat business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-purple-100 hover:border-purple-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Digital Loyalty Cards</CardTitle>
                <CardDescription>
                  Replace punch cards with beautiful digital loyalty cards that customers can't lose
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-blue-100 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Flexible Rewards</CardTitle>
                <CardDescription>
                  Create any type of reward - discounts, free items, experiences, or custom perks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-green-100 hover:border-green-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Tier System</CardTitle>
                <CardDescription>
                  Motivate customers with bronze, silver, gold tiers and exclusive benefits
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-100 hover:border-orange-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Track customer behavior, retention rates, and program ROI with detailed insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-red-100 hover:border-red-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Automated Campaigns</CardTitle>
                <CardDescription>
                  Send personalized offers, birthday rewards, and win-back campaigns automatically
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-indigo-100 hover:border-indigo-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>Fraud Protection</CardTitle>
                <CardDescription>
                  Advanced security measures protect against point fraud and abuse
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">Proven Results</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">+35%</div>
              <div className="text-purple-100">Customer Retention</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">+28%</div>
              <div className="text-purple-100">Average Order Value</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">+42%</div>
              <div className="text-purple-100">Visit Frequency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that grows with your business</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-3xl font-bold">$49<span className="text-lg font-normal">/month</span></div>
                <CardDescription>Perfect for small businesses getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">✓ Up to 500 loyalty members</li>
                  <li className="flex items-center">✓ Basic rewards system</li>
                  <li className="flex items-center">✓ Email support</li>
                  <li className="flex items-center">✓ Standard analytics</li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Get Started</Button>
              </CardContent>
            </Card>

            <Card className="border-purple-200 relative">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle>Growth</CardTitle>
                <div className="text-3xl font-bold">$99<span className="text-lg font-normal">/month</span></div>
                <CardDescription>For growing businesses with more customers</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">✓ Up to 2,500 loyalty members</li>
                  <li className="flex items-center">✓ Advanced rewards & tiers</li>
                  <li className="flex items-center">✓ SMS marketing</li>
                  <li className="flex items-center">✓ Priority support</li>
                  <li className="flex items-center">✓ Advanced analytics</li>
                </ul>
                <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700">Get Started</Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <div className="text-3xl font-bold">$199<span className="text-lg font-normal">/month</span></div>
                <CardDescription>For established businesses and multiple locations</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">✓ Unlimited loyalty members</li>
                  <li className="flex items-center">✓ Multi-location support</li>
                  <li className="flex items-center">✓ API access</li>
                  <li className="flex items-center">✓ Phone support</li>
                  <li className="flex items-center">✓ Custom integrations</li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Get Started</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Build Customer Loyalty?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using our platform to create lasting customer relationships
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-6 text-lg">
              Start Your Free Trial
            </Button>
          </Link>
          <p className="text-gray-500 text-sm mt-4">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Crown className="h-6 w-6 text-purple-400" />
                <span className="text-xl font-bold">LoyaltyMax</span>
              </div>
              <p className="text-gray-400 text-sm">
                Building customer loyalty for businesses worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/demo">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/status">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/security">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            © 2024 LoyaltyMax. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}