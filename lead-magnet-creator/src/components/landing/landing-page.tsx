'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Zap, 
  Target, 
  BarChart3, 
  Users, 
  ArrowRight,
  CheckCircle,
  Star,
  Play
} from 'lucide-react'

export function LandingPage() {
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async (provider: 'google' | 'github') => {
    setIsSigningIn(true)
    try {
      await signIn(provider, { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Navigation */}
      <nav className="container-wrapper py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Lead Magnet Creator</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Testimonials
            </Link>
            <Button variant="outline" size="sm" onClick={() => handleSignIn('google')}>
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container-wrapper section-padding">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
              <Sparkles className="mr-2 h-4 w-4" />
              AI-Powered Lead Generation Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Create{' '}
              <span className="text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                High-Converting
              </span>{' '}
              Lead Magnets in Minutes
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Transform your lead generation with AI-powered content creation, professional templates, 
              and conversion optimization tools. No design skills needed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => handleSignIn('google')}
              disabled={isSigningIn}
              className="text-base px-8 py-3"
            >
              {isSigningIn ? (
                'Starting...'
              ) : (
                <>
                  Start Creating Free <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8 py-3">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Free forever plan
            </div>
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Setup in 2 minutes
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container-wrapper section-padding bg-secondary/20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Everything You Need to Generate Leads</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powerful features designed to maximize your conversion rates and grow your email list
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI Content Generation</h3>
              <p className="text-muted-foreground">
                Create compelling eBooks, checklists, templates, and calculators with advanced AI assistance.
              </p>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Design Studio</h3>
              <p className="text-muted-foreground">
                Professional templates and drag-and-drop editor to create stunning lead magnets without design skills.
              </p>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Conversion Optimization</h3>
              <p className="text-muted-foreground">
                A/B testing, landing page builder, and form optimization to maximize your conversion rates.
              </p>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Track performance, conversion rates, and lead quality with detailed analytics and reporting.
              </p>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Work together with your team, share feedback, and manage approvals in real-time.
              </p>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Integrations</h3>
              <p className="text-muted-foreground">
                Connect with your favorite email marketing tools, CRMs, and automation platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container-wrapper section-padding">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="card p-8 hover:shadow-lg transition-shadow">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold">Starter</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-muted-foreground ml-1">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Perfect for solopreneurs</p>
              </div>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  10 AI generations/month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  5K monthly visitors
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Basic templates
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Email support
                </li>
              </ul>
              
              <Button className="w-full" onClick={() => handleSignIn('google')}>
                Start Free Trial
              </Button>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="card p-8 ring-2 ring-primary hover:shadow-lg transition-shadow relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold">Professional</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-muted-foreground ml-1">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">For growing businesses</p>
              </div>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  50 AI generations/month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  25K monthly visitors
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Premium templates + Images
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  A/B testing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Priority support
                </li>
              </ul>
              
              <Button className="w-full" onClick={() => handleSignIn('google')}>
                Start Free Trial
              </Button>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="card p-8 hover:shadow-lg transition-shadow">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold">Enterprise</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold">$199</span>
                  <span className="text-muted-foreground ml-1">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">For teams and agencies</p>
              </div>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  200 AI generations/month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Unlimited visitors
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  White-label options
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  API access
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Dedicated support
                </li>
              </ul>
              
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container-wrapper section-padding bg-secondary/20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Loved by Thousands of Marketers</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            See what our customers are saying about Lead Magnet Creator
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="card p-6">
            <div className="space-y-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground">
                "Increased our lead conversion by 400% in just 2 months. The AI content generation is incredible!"
              </p>
              <div>
                <p className="font-semibold">Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">Marketing Director, TechCorp</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="space-y-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground">
                "Finally, a tool that makes creating professional lead magnets actually fun and fast."
              </p>
              <div>
                <p className="font-semibold">Mike Chen</p>
                <p className="text-sm text-muted-foreground">Founder, GrowthHacks</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="space-y-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground">
                "The A/B testing features helped us optimize our forms and double our signup rate."
              </p>
              <div>
                <p className="font-semibold">Emily Rodriguez</p>
                <p className="text-sm text-muted-foreground">Head of Marketing, StartupXYZ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-wrapper section-padding">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to Transform Your Lead Generation?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of marketers who are already creating high-converting lead magnets with AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => handleSignIn('google')}
              disabled={isSigningIn}
              className="text-base px-8 py-3"
            >
              {isSigningIn ? (
                'Starting...'
              ) : (
                <>
                  Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8 py-3">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-secondary/20">
        <div className="container-wrapper py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="font-bold">Lead Magnet Creator</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered lead generation platform for modern marketers.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link></li>
                <li><Link href="/integrations" className="hover:text-foreground transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/guides" className="hover:text-foreground transition-colors">Guides</Link></li>
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/api" className="hover:text-foreground transition-colors">API Docs</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Lead Magnet Creator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}