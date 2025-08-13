'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon, 
  ShieldCheckIcon, 
  BoltIcon, 
  DevicePhoneMobileIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { 
  ChartBarIcon as ChartBarSolidIcon,
  HeartIcon,
  CpuChipIcon
} from '@heroicons/react/24/solid'

const features = [
  {
    name: 'Real-time Health Scoring',
    description: 'Get a comprehensive health score (0-100) that tracks your business performance across 5 key categories.',
    icon: HeartIcon,
    color: 'text-red-600',
  },
  {
    name: 'AI-Powered Insights',
    description: 'Advanced algorithms analyze your data to provide actionable insights and predict potential issues.',
    icon: CpuChipIcon,
    color: 'text-purple-600',
  },
  {
    name: 'Smart Alerts',
    description: 'Intelligent alerting system that notifies you of important changes before they become problems.',
    icon: BoltIcon,
    color: 'text-yellow-600',
  },
  {
    name: 'Comprehensive Analytics',
    description: 'Detailed charts and metrics covering financial, customer, operational, and growth data.',
    icon: ChartBarSolidIcon,
    color: 'text-blue-600',
  },
  {
    name: 'Enterprise Security',
    description: 'Bank-level security with encryption, compliance, and role-based access control.',
    icon: ShieldCheckIcon,
    color: 'text-green-600',
  },
  {
    name: 'Mobile-First Design',
    description: 'Optimized for mobile devices so you can monitor your business health anywhere.',
    icon: DevicePhoneMobileIcon,
    color: 'text-indigo-600',
  },
]

const pricing = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'Perfect for small businesses getting started',
    features: [
      'Up to 3 team members',
      'Basic health dashboard',
      'Email alerts',
      '3 integrations',
      '90 days data retention',
      'Community support'
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/month',
    description: 'Best for growing businesses',
    features: [
      'Up to 15 team members',
      'Advanced analytics',
      'Custom alerts',
      '10 integrations',
      '1 year data retention',
      'Email support',
      'API access',
      'Custom reports'
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$499',
    period: '/month',
    description: 'For large organizations',
    features: [
      'Up to 100 team members',
      'White labeling',
      'SSO integration',
      '50 integrations',
      '3 years data retention',
      'Priority support',
      'Advanced security',
      'Custom development'
    ],
    highlighted: false,
  },
]

const stats = [
  { label: 'Businesses monitored', value: '2,500+' },
  { label: 'Health score accuracy', value: '94%' },
  { label: 'Average response time', value: '<2min' },
  { label: 'Uptime guarantee', value: '99.9%' },
]

export default function LandingPage() {
  useEffect(() => {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth'
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <HeartIcon className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Business Health Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="btn-ghost">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-8">
              The{' '}
              <span className="gradient-text-health">Fitbit for your Business</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
              Monitor your business health in real-time with AI-powered insights, 
              smart alerts, and comprehensive analytics. Make data-driven decisions 
              that drive growth and prevent problems before they happen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/signup" className="btn-primary text-lg px-8 py-4">
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/demo" className="btn-secondary text-lg px-8 py-4">
                Watch Demo
              </Link>
            </div>
          </motion.div>

          {/* Hero Image/Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-6">
                {/* Mock Dashboard Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Business Health Overview
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
                  </div>
                </div>
                
                {/* Mock Health Score */}
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white">
                    <span className="text-3xl font-bold">87</span>
                  </div>
                  <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    Excellent Health
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    +5 points from last week
                  </p>
                </div>
                
                {/* Mock Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Revenue', value: '$125.4K', trend: '+12%' },
                    { label: 'Customers', value: '1,284', trend: '+8%' },
                    { label: 'Cash Flow', value: '$45.2K', trend: '+15%' },
                    { label: 'Growth Rate', value: '23%', trend: '+3%' },
                  ].map((metric, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                      <p className="text-sm text-green-600">{metric.trend}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to monitor business health
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and insights you need 
              to keep your business healthy and growing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-hover p-8"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 mb-6`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {feature.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your business size and needs. 
              All plans include a 14-day free trial.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`card p-8 relative ${
                  plan.highlighted 
                    ? 'ring-2 ring-primary-600 scale-105' 
                    : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`w-full text-center ${
                    plan.highlighted ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  Start Free Trial
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Ready to get your business health score?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
              Join thousands of businesses that trust our platform to monitor 
              their health and drive growth.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/signup" className="btn-primary text-lg px-8 py-4">
                Start Your Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <StarIcon className="h-5 w-5 text-yellow-400 mr-2" />
                4.9/5 rating from 500+ reviews
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <HeartIcon className="h-8 w-8 text-red-600" />
                <span className="text-xl font-bold">Business Health Dashboard</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The comprehensive business health monitoring platform that helps 
                you make better decisions and grow your business.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
                <li><Link href="/api" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Business Health Dashboard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}