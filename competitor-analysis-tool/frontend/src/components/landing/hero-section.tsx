'use client'

import { useState } from 'react'
import { ArrowRight, Eye, TrendingUp, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const stats = [
  { icon: Eye, label: 'Competitors Monitored', value: '50K+' },
  { icon: TrendingUp, label: 'Data Points Analyzed', value: '10M+' },
  { icon: Users, label: 'Happy Customers', value: '2.5K+' },
  { icon: Zap, label: 'Real-time Updates', value: '24/7' },
]

export function HeroSection() {
  const [email, setEmail] = useState('')

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-24 lg:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/50 to-background/80" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <Badge 
            variant="secondary" 
            className="mb-6 animate-fade-in-up px-4 py-2 text-sm font-medium"
          >
            🚀 New: AI-Powered Competitive Intelligence
          </Badge>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Stay Ahead with
            <span className="gradient-text"> AI-Powered </span>
            Competitor Analysis
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Automatically monitor competitors, analyze market trends, and get strategic insights 
            that help you make data-driven decisions. Enterprise-grade intelligence without the enterprise price.
          </p>

          {/* CTA Buttons */}
          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" className="px-8 py-3 text-lg font-semibold" asChild>
              <Link href="/dashboard">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-3 text-lg font-semibold"
              asChild
            >
              <Link href="#demo">
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <p className="mb-12 text-sm text-muted-foreground">
            Trusted by 2,500+ businesses • No credit card required • 14-day free trial
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center space-y-2"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="rounded-full bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
    </section>
  )
}