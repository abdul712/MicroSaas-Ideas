'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Smartphone, BarChart3, Clock, Globe, Shield, Zap, Users } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="h-8 w-8 text-restaurant-500" />
            <span className="text-2xl font-bold text-gray-900">QR Menu</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost">Sign In</Button>
            <Button variant="restaurant">Get Started</Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Create Beautiful{' '}
            <span className="restaurant-gradient bg-clip-text text-transparent">
              QR Code Menus
            </span>{' '}
            in Minutes
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            Transform your restaurant with digital menus that update instantly, track customer preferences, 
            and provide contactless dining experiences. No app downloads required.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="restaurant" className="text-lg px-8 py-3">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              View Demo
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required • 14-day free trial • Setup in 5 minutes
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Everything You Need for Digital Menus
          </h2>
          <p className="text-xl text-gray-600">
            Powerful features designed specifically for restaurants and cafes
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="menu-card">
            <CardHeader>
              <Smartphone className="h-12 w-12 text-restaurant-500 mb-4" />
              <CardTitle>Mobile-First Design</CardTitle>
              <CardDescription>
                Perfect mobile experience with fast loading, easy navigation, and touch-optimized interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="menu-card">
            <CardHeader>
              <Zap className="h-12 w-12 text-restaurant-500 mb-4" />
              <CardTitle>Instant Updates</CardTitle>
              <CardDescription>
                Change prices, add items, or update descriptions instantly without reprinting menus
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="menu-card">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-restaurant-500 mb-4" />
              <CardTitle>Menu Analytics</CardTitle>
              <CardDescription>
                Track popular items, peak hours, and customer preferences with detailed analytics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="menu-card">
            <CardHeader>
              <Globe className="h-12 w-12 text-restaurant-500 mb-4" />
              <CardTitle>Multi-Language Support</CardTitle>
              <CardDescription>
                Serve international customers with automatic translations and multiple language options
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="menu-card">
            <CardHeader>
              <Clock className="h-12 w-12 text-restaurant-500 mb-4" />
              <CardTitle>Quick Setup</CardTitle>
              <CardDescription>
                Get your digital menu live in minutes with our intuitive menu builder and templates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="menu-card">
            <CardHeader>
              <Shield className="h-12 w-12 text-restaurant-500 mb-4" />
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>
                Enterprise-grade security with 99.9% uptime guarantee and data protection
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4 text-center">
            <div>
              <div className="text-4xl font-bold text-restaurant-500 mb-2">10,000+</div>
              <div className="text-gray-600">Restaurants Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-restaurant-500 mb-2">50M+</div>
              <div className="text-gray-600">Menu Views</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-restaurant-500 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-restaurant-500 mb-2">&lt;2s</div>
              <div className="text-gray-600">Average Load Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your restaurant's needs
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for trying out</CardDescription>
              <div className="text-3xl font-bold">$0<span className="text-base font-normal">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 1 menu</li>
                <li>• 50 items max</li>
                <li>• Basic QR code</li>
                <li>• Standard analytics</li>
                <li>• Community support</li>
              </ul>
              <Button className="w-full mt-6" variant="outline">Get Started</Button>
            </CardContent>
          </Card>

          <Card className="border-restaurant-200 border-2">
            <CardHeader>
              <CardTitle>Professional</CardTitle>
              <CardDescription>Most popular choice</CardDescription>
              <div className="text-3xl font-bold">$49<span className="text-base font-normal">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 3 locations</li>
                <li>• Unlimited items</li>
                <li>• Custom QR design</li>
                <li>• Advanced analytics</li>
                <li>• Multi-language support</li>
                <li>• Priority support</li>
              </ul>
              <Button className="w-full mt-6" variant="restaurant">Start Free Trial</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chain</CardTitle>
              <CardDescription>For restaurant chains</CardDescription>
              <div className="text-3xl font-bold">$149<span className="text-base font-normal">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Unlimited locations</li>
                <li>• Central management</li>
                <li>• White-label option</li>
                <li>• Custom features</li>
                <li>• Phone support</li>
                <li>• Training included</li>
              </ul>
              <Button className="w-full mt-6" variant="outline">Contact Sales</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="restaurant-gradient py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-4xl font-bold">
            Ready to Go Digital?
          </h2>
          <p className="mb-8 text-xl opacity-90">
            Join thousands of restaurants already using QR Menu Generator
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <QrCode className="h-6 w-6" />
                <span className="text-xl font-bold">QR Menu</span>
              </div>
              <p className="text-gray-400">
                The easiest way to create digital menus for your restaurant.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Demo</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Setup Guide</li>
                <li>Status</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Blog</li>
                <li>Privacy</li>
                <li>Terms</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 QR Menu Generator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}