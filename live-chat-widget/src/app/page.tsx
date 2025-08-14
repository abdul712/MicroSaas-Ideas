import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Users, BarChart3, Bot, Smartphone, Globe } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">LiveChat</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Convert visitors into customers with 
            <span className="text-blue-600"> instant conversations</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Our live chat widget increases conversions by 40% and customer satisfaction by 90%, 
            all while reducing support costs by half.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need for customer success
          </h2>
          <p className="text-xl text-gray-600">
            Powerful features designed to help you provide exceptional customer support
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <CardTitle>Real-time Messaging</CardTitle>
              <CardDescription>
                Instant messaging with typing indicators, read receipts, and file sharing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Lightning-fast message delivery</li>
                <li>• Rich media support</li>
                <li>• Emoji reactions</li>
                <li>• Message encryption</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600" />
              <CardTitle>Multi-agent Support</CardTitle>
              <CardDescription>
                Intelligent routing and team collaboration tools for efficient support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Smart conversation routing</li>
                <li>• Team collaboration</li>
                <li>• Internal notes</li>
                <li>• Conversation transfer</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bot className="h-8 w-8 text-blue-600" />
              <CardTitle>AI-Powered Features</CardTitle>
              <CardDescription>
                Chatbot integration with intent recognition and automated responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Intelligent chatbot</li>
                <li>• Sentiment analysis</li>
                <li>• Auto-responses</li>
                <li>• Language translation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Detailed insights into chat performance and customer satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Response time tracking</li>
                <li>• Conversion analytics</li>
                <li>• Customer satisfaction scores</li>
                <li>• Agent performance metrics</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Smartphone className="h-8 w-8 text-blue-600" />
              <CardTitle>Mobile Optimized</CardTitle>
              <CardDescription>
                Perfect experience across all devices with dedicated mobile apps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Responsive design</li>
                <li>• Mobile agent app</li>
                <li>• Push notifications</li>
                <li>• Touch-optimized interface</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-8 w-8 text-blue-600" />
              <CardTitle>Easy Integration</CardTitle>
              <CardDescription>
                One-line installation with extensive customization options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Simple embed code</li>
                <li>• Custom branding</li>
                <li>• API integrations</li>
                <li>• WordPress plugin</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that's right for your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="relative">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-3xl font-bold">$15</div>
                <CardDescription>per agent/month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li>• Unlimited chats</li>
                  <li>• Remove branding</li>
                  <li>• Email support</li>
                  <li>• Basic analytics</li>
                  <li>• Canned responses</li>
                </ul>
                <Button className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>

            <Card className="relative border-blue-500 border-2">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  Most Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <div className="text-3xl font-bold">$35</div>
                <CardDescription>per agent/month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li>• Everything in Starter</li>
                  <li>• Advanced routing</li>
                  <li>• Detailed analytics</li>
                  <li>• API access</li>
                  <li>• Integrations</li>
                  <li>• Visitor insights</li>
                </ul>
                <Button className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader>
                <CardTitle>Business</CardTitle>
                <div className="text-3xl font-bold">$65</div>
                <CardDescription>per agent/month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li>• Everything in Professional</li>
                  <li>• AI chatbot</li>
                  <li>• Custom branding</li>
                  <li>• Phone support</li>
                  <li>• Advanced security</li>
                  <li>• SLA guarantee</li>
                </ul>
                <Button className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <MessageCircle className="h-6 w-6 text-blue-400" />
                <span className="ml-2 text-lg font-bold">LiveChat</span>
              </div>
              <p className="text-gray-400">
                Convert visitors into customers with instant conversations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/integrations">Integrations</Link></li>
                <li><Link href="/api">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/docs">Documentation</Link></li>
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/status">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 LiveChat. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}