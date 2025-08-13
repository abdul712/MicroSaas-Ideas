'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Clock, 
  Play, 
  Pause, 
  DollarSign, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  Globe,
  CheckCircle,
  Timer,
  Receipt,
  TrendingUp,
  Smartphone,
  Monitor,
  Calendar,
  Star,
  ArrowRight,
  ChevronDown
} from 'lucide-react'

export function LandingPage() {
  const { data: session } = useSession()
  const [isTimerDemo, setIsTimerDemo] = useState(false)
  const [demoTime, setDemoTime] = useState(0)

  const features = [
    {
      icon: Timer,
      title: 'Smart Time Tracking',
      description: 'One-click timers with automatic project detection and idle time monitoring.',
      color: 'text-blue-500'
    },
    {
      icon: Receipt,
      title: 'Automated Billing',
      description: 'Generate invoices automatically from tracked time with customizable rates.',
      color: 'text-green-500'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Real-time team dashboards with approval workflows and role management.',
      color: 'text-purple-500'
    },
    {
      icon: BarChart3,
      title: 'Productivity Analytics',
      description: 'Detailed insights into time allocation, productivity scores, and trends.',
      color: 'text-orange-500'
    },
    {
      icon: Smartphone,
      title: 'Cross-Platform Sync',
      description: 'Desktop, web, and mobile apps with offline sync and real-time updates.',
      color: 'text-pink-500'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'GDPR compliant with encryption, MFA, and comprehensive audit logs.',
      color: 'text-red-500'
    }
  ]

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '1 user',
        '2 projects',
        'Basic time tracking',
        '7-day history',
        'CSV export'
      ],
      buttonText: 'Start Free',
      popular: false
    },
    {
      name: 'Freelancer',
      price: '$8',
      period: 'per month',
      description: 'For independent professionals',
      features: [
        '1 user',
        'Unlimited projects',
        'Automatic tracking',
        'All integrations',
        'Unlimited history',
        'Invoice generation',
        'Priority support'
      ],
      buttonText: 'Start Trial',
      popular: true
    },
    {
      name: 'Team',
      price: '$12',
      period: 'per user/month',
      description: 'For growing teams',
      features: [
        'Minimum 2 users',
        'Team dashboards',
        'Approval workflows',
        'Admin controls',
        'API access',
        'Advanced analytics',
        'Custom integrations'
      ],
      buttonText: 'Start Trial',
      popular: false
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Freelance Designer',
      company: 'Design Studio Pro',
      avatar: '/avatars/sarah.jpg',
      content: 'TimeTracker Pro helped me increase my billable hours by 25% just by accurately tracking time I was missing before.',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      role: 'CTO',
      company: 'TechFlow Agency',
      avatar: '/avatars/michael.jpg',
      content: 'The team collaboration features are incredible. We can see real-time productivity across all our projects.',
      rating: 5
    },
    {
      name: 'Emily Johnson',
      role: 'Legal Consultant',
      company: 'Johnson Law',
      avatar: '/avatars/emily.jpg',
      content: 'Automated invoicing based on tracked time has saved me hours every week. The reports are client-ready.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Clock className="h-8 w-8 text-brand-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">TimeTracker Pro</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <Link href="/dashboard">
                  <Button variant="default">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button variant="default">Start Free Trial</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Never lose another</span>
                <span className="block text-brand-600">billable hour</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Automatically track time across all your projects, generate accurate client reports in seconds, 
                and increase your revenue by 20% with intelligent time capture and seamless billing integration.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/signup">
                    <Button size="xl" className="w-full sm:w-auto">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="xl" variant="outline" className="w-full sm:w-auto">
                    Watch Demo
                    <Play className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  No credit card required • 14-day free trial • Cancel anytime
                </p>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <Card className="p-6">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Live Timer Demo</CardTitle>
                    <CardDescription>See how easy time tracking can be</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-mono font-bold text-brand-600 mb-2">
                        {Math.floor(demoTime / 3600).toString().padStart(2, '0')}:
                        {Math.floor((demoTime % 3600) / 60).toString().padStart(2, '0')}:
                        {(demoTime % 60).toString().padStart(2, '0')}
                      </div>
                      <p className="text-sm text-gray-500">Currently tracking: Web Development</p>
                    </div>
                    <div className="flex justify-center space-x-3">
                      <Button
                        variant={isTimerDemo ? "destructive" : "success"}
                        size="timer"
                        onClick={() => {
                          setIsTimerDemo(!isTimerDemo)
                          if (!isTimerDemo) {
                            const interval = setInterval(() => {
                              setDemoTime(prev => prev + 1)
                            }, 1000)
                            return () => clearInterval(interval)
                          }
                        }}
                      >
                        {isTimerDemo ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need to track time effectively
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              From simple timers to advanced analytics, we've got you covered.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="relative hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Start free, upgrade when you need more features.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-brand-500 shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-brand-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-base font-medium text-gray-500">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Trusted by professionals worldwide
            </h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to boost your productivity?</span>
            <span className="block text-brand-200">Start tracking time today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="/auth/signup">
                <Button size="xl" variant="secondary">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-brand-400" />
              <span className="ml-2 text-lg font-bold text-white">TimeTracker Pro</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 TimeTracker Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}