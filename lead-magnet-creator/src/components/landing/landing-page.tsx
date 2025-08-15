'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Download, 
  Edit3, 
  Mail, 
  Palette, 
  Zap, 
  Shield,
  BarChart3,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  FileText,
  Layout,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">Lead Magnet Creator</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#templates">
            Templates
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
            Pricing
          </Link>
          <Button variant="outline" size="sm">
            Sign In
          </Button>
          <Button size="sm">
            Get Started
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Create Stunning Lead Magnets in{' '}
                  <span className="text-primary">Minutes</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Design professional lead magnets, create high-converting opt-in forms, and build landing pages 
                  without any design skills. Choose a template, customize, and start capturing leads immediately.
                </p>
              </div>
              <div className="space-x-4">
                <Button size="lg" className="h-12 px-8">
                  Start Creating Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8">
                  View Templates
                </Button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
                <span>•</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free templates included</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need to Capture Leads
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  From design to deployment, our platform provides all the tools you need to create 
                  and manage effective lead generation campaigns.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <Edit3 className="h-8 w-8 text-primary" />
                  <CardTitle>Drag & Drop Editor</CardTitle>
                  <CardDescription>
                    Visual editor with professional templates. Customize colors, fonts, images, and content with ease.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 text-primary" />
                  <CardTitle>PDF Generation</CardTitle>
                  <CardDescription>
                    High-quality PDF export for eBooks, checklists, guides, and reports. Print-ready and mobile-optimized.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Layout className="h-8 w-8 text-primary" />
                  <CardTitle>Landing Pages</CardTitle>
                  <CardDescription>
                    Auto-generated landing pages with mobile-responsive design and SEO optimization.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Mail className="h-8 w-8 text-primary" />
                  <CardTitle>Email Capture</CardTitle>
                  <CardDescription>
                    Built-in opt-in forms with CRM integrations. Connect to Mailchimp, ConvertKit, and more.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    Track conversions, downloads, and performance metrics. A/B test your lead magnets for optimization.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary" />
                  <CardTitle>GDPR Compliant</CardTitle>
                  <CardDescription>
                    Built-in compliance features for GDPR, CAN-SPAM, and TCPA requirements. Secure and trustworthy.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section id="templates" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Professional Templates for Every Industry
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Choose from our library of professionally designed templates or create your own from scratch.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-4 lg:gap-8">
              {[
                { title: 'eBooks', desc: '15+ Templates', icon: FileText },
                { title: 'Checklists', desc: '20+ Templates', icon: CheckCircle },
                { title: 'Guides', desc: '12+ Templates', icon: Download },
                { title: 'Worksheets', desc: '18+ Templates', icon: Edit3 }
              ].map((template, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <template.icon className="h-12 w-12 mx-auto text-primary" />
                    <CardTitle>{template.title}</CardTitle>
                    <CardDescription>{template.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Trusted by Businesses Worldwide
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {[
                  { metric: '10,000+', label: 'Lead Magnets Created' },
                  { metric: '500K+', label: 'Leads Captured' },
                  { metric: '95%', label: 'Customer Satisfaction' }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl font-bold text-primary">{stat.metric}</div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Ready to Start Capturing Leads?
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Join thousands of businesses using Lead Magnet Creator to grow their email lists and boost conversions.
                </p>
              </div>
              <div className="space-x-4">
                <Button size="lg" className="h-12 px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8">
                  Book a Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 Lead Magnet Creator. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Support
          </Link>
        </nav>
      </footer>
    </div>
  )
}