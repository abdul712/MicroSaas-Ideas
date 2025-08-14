'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Brain, Users, TrendingUp, Shield, Zap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export function LandingPage() {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">TaskAI</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            Sign In
          </Link>
          <Button asChild>
            <Link href="/auth/signup">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 dark:text-gray-300 ring-1 ring-gray-900/10 dark:ring-gray-100/10 hover:ring-gray-900/20 dark:hover:ring-gray-100/20">
                🚀 AI-Powered Task Delegation Platform{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Now Available <ArrowRight className="inline w-4 h-4 ml-1" />
                </span>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
              Intelligent Task
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600"> Delegation</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Transform your team productivity with AI-powered task assignment, real-time collaboration, 
              and intelligent workload management. Stop micromanaging, start optimizing.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" className="px-8 py-3 text-base" asChild>
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#demo">Watch Demo</Link>
              </Button>
            </div>
            <div className="mt-8 flex justify-center items-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                Setup in 5 minutes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">AI-Powered Intelligence</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to optimize team delegation
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Our AI engine learns from your team's patterns to make intelligent task assignments, 
              predict completion times, and prevent burnout before it happens.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <Brain className="h-5 w-5 flex-none text-indigo-600 dark:text-indigo-400" />
                  AI Task Assignment
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">
                    Intelligent matching of tasks to team members based on skills, availability, workload, 
                    and performance history. Get 90% assignment accuracy with confidence scoring.
                  </p>
                </dd>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <TrendingUp className="h-5 w-5 flex-none text-indigo-600 dark:text-indigo-400" />
                  Workload Intelligence
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">
                    Real-time cognitive load monitoring with burnout prevention alerts. 
                    Dynamic workload rebalancing keeps your team in the optimal productivity zone.
                  </p>
                </dd>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <Users className="h-5 w-5 flex-none text-indigo-600 dark:text-indigo-400" />
                  Real-time Collaboration
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">
                    Live task updates, team presence indicators, and instant communication threads. 
                    Collaborate seamlessly with conflict resolution and version control.
                  </p>
                </dd>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <Zap className="h-5 w-5 flex-none text-indigo-600 dark:text-indigo-400" />
                  Performance Analytics
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">
                    Advanced productivity insights with predictive completion times, 
                    quality tracking, and team performance optimization recommendations.
                  </p>
                </dd>
              </div>

              {/* Feature 5 */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <Shield className="h-5 w-5 flex-none text-indigo-600 dark:text-indigo-400" />
                  Enterprise Security
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">
                    Bank-level security with end-to-end encryption, SOC 2 compliance, 
                    audit logging, and granular role-based access control.
                  </p>
                </dd>
              </div>

              {/* Feature 6 */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <CheckCircle2 className="h-5 w-5 flex-none text-indigo-600 dark:text-indigo-400" />
                  Smart Automation
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">
                    Automated follow-ups, deadline reminders, and escalation workflows. 
                    Integrate with Slack, email, calendars, and 50+ productivity tools.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-indigo-600 dark:bg-indigo-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Trusted by innovative teams worldwide
              </h2>
              <p className="mt-4 text-lg leading-8 text-indigo-200">
                Our AI-powered delegation platform delivers measurable results
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col bg-white/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-indigo-200">Task Completion Rate</dt>
                <dd className="order-first text-3xl font-bold tracking-tight text-white">+25%</dd>
              </div>
              <div className="flex flex-col bg-white/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-indigo-200">Time to Assignment</dt>
                <dd className="order-first text-3xl font-bold tracking-tight text-white">&lt;30s</dd>
              </div>
              <div className="flex flex-col bg-white/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-indigo-200">Team Satisfaction</dt>
                <dd className="order-first text-3xl font-bold tracking-tight text-white">95%</dd>
              </div>
              <div className="flex flex-col bg-white/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-indigo-200">Burnout Reduction</dt>
                <dd className="order-first text-3xl font-bold tracking-tight text-white">-40%</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white dark:bg-slate-900">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Ready to transform your team productivity?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              Join thousands of teams already using AI-powered delegation to achieve 
              unprecedented productivity and team satisfaction.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="xl" asChild>
                <Link href="/auth/signup">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link href="#contact">Schedule Demo</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              14-day free trial • No credit card required • Setup in minutes
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
              &copy; 2024 TaskAI. All rights reserved.
            </p>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <div className="flex items-center justify-center md:justify-start">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-md flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">TaskAI</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}