import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Mail, 
  Calendar,
  BarChart3,
  Shield,
  Smartphone,
  Zap,
  Check,
  ArrowRight,
  Star
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Simple CRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              ✨ Built for Small Business
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Manage your customers in{' '}
              <span className="text-blue-600">minutes</span>, not hours
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Simple CRM gives you everything you need to track customers, deals, and communications 
              without the complexity of enterprise software. Set up in 5 minutes, use forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto gradient-primary text-white">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Free 14-day trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to grow your business
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Streamlined features designed specifically for small businesses and startups
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Contact Management</CardTitle>
                <CardDescription>
                  Organize all your contacts with custom fields, tags, and company associations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Sales Pipeline</CardTitle>
                <CardDescription>
                  Visual drag-and-drop pipeline to track deals from lead to closing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Email Integration</CardTitle>
                <CardDescription>
                  Connect Gmail and Outlook for seamless email tracking and management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Activity Tracking</CardTitle>
                <CardDescription>
                  Automatic timeline of all customer interactions and communication history
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Reports & Analytics</CardTitle>
                <CardDescription>
                  Sales performance dashboards and business intelligence insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>Mobile Ready</CardTitle>
                <CardDescription>
                  Progressive web app with offline capabilities and mobile optimization
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Built for small business owners who value simplicity
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">5-minute setup</h3>
                    <p className="text-gray-600">Get started immediately without complex configuration</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">No training required</h3>
                    <p className="text-gray-600">Intuitive interface that anyone can use from day one</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Affordable pricing</h3>
                    <p className="text-gray-600">Starting at just $15/month for up to 500 contacts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Secure & reliable</h3>
                    <p className="text-gray-600">Enterprise-grade security with 99.9% uptime guarantee</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Lightning Fast</h3>
                    <p className="text-gray-600">Optimized for speed and performance</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">GDPR Compliant</h3>
                    <p className="text-gray-600">Full data protection and privacy controls</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">5-Star Support</h3>
                    <p className="text-gray-600">Dedicated support team ready to help</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600">
              Choose the plan that fits your business size
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="relative">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-3xl font-bold">$15<span className="text-lg font-normal text-gray-600">/month</span></div>
                <CardDescription>Perfect for freelancers and small teams</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Up to 500 contacts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>2 users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Basic features</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Get Started</Button>
              </CardContent>
            </Card>

            <Card className="relative border-blue-200 shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <div className="text-3xl font-bold">$39<span className="text-lg font-normal text-gray-600">/month</span></div>
                <CardDescription>Great for growing businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Up to 5,000 contacts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>5 users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>All features</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>API access</span>
                  </li>
                </ul>
                <Button className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader>
                <CardTitle>Business</CardTitle>
                <div className="text-3xl font-bold">$79<span className="text-lg font-normal text-gray-600">/month</span></div>
                <CardDescription>For established businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Unlimited contacts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>15 users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Custom fields</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Get Started</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to grow your business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of small businesses already using Simple CRM
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-blue-700">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Simple CRM</h3>
              </div>
              <p className="text-gray-400">
                Customer relationship management designed for small businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Simple CRM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}