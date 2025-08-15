'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, TrendingUp, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Enterprise-Grade Analytics Platform
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              See How Users{' '}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Really Use
              </span>{' '}
              Your Website
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground sm:text-2xl">
              Understand user behavior with click heatmaps, scroll maps, and session recordings. 
              Get actionable insights to optimize your website conversion rates.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap justify-center gap-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">
                <span className="text-2xl font-bold text-primary">47%</span> avg. conversion increase
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">
                <span className="text-2xl font-bold text-primary">10K+</span> websites analyzed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">
                <span className="text-2xl font-bold text-primary">&lt;50ms</span> tracking load time
              </span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="/demo">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by teams at leading companies
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {['Shopify', 'Stripe', 'Notion', 'Linear', 'Vercel', 'GitHub'].map((company) => (
                <div key={company} className="text-sm font-medium text-muted-foreground">
                  {company}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hero Visual/Demo */}
      <motion.div
        className="container px-4 md:px-6 mt-16"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
      >
        <div className="relative max-w-5xl mx-auto">
          <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden">
            {/* Mock dashboard */}
            <div className="bg-gradient-to-br from-background via-muted/20 to-background p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mock heatmap */}
                <div className="lg:col-span-2 bg-background rounded-lg border p-4">
                  <div className="h-64 bg-gradient-to-br from-primary/10 via-transparent to-destructive/10 rounded relative overflow-hidden">
                    {/* Simulated heatmap dots */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className={`absolute rounded-full animate-pulse ${
                          i % 3 === 0 ? 'bg-destructive/60 w-8 h-8' :
                          i % 3 === 1 ? 'bg-primary/60 w-6 h-6' :
                          'bg-secondary/60 w-4 h-4'
                        }`}
                        style={{
                          left: `${20 + (i * 7) % 60}%`,
                          top: `${15 + (i * 11) % 70}%`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <h3 className="font-semibold">Click Heatmap</h3>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                </div>

                {/* Mock metrics */}
                <div className="space-y-4">
                  <div className="bg-background rounded-lg border p-4">
                    <div className="text-2xl font-bold text-primary">2,847</div>
                    <div className="text-sm text-muted-foreground">Total Clicks</div>
                    <div className="text-xs text-green-600">+12% vs last week</div>
                  </div>
                  <div className="bg-background rounded-lg border p-4">
                    <div className="text-2xl font-bold text-secondary">68%</div>
                    <div className="text-sm text-muted-foreground">Scroll Depth</div>
                    <div className="text-xs text-green-600">+5% vs last week</div>
                  </div>
                  <div className="bg-background rounded-lg border p-4">
                    <div className="text-2xl font-bold text-accent">3.2s</div>
                    <div className="text-sm text-muted-foreground">Avg Time on Page</div>
                    <div className="text-xs text-red-600">-8% vs last week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating elements */}
          <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            Real-time data
          </div>
          <div className="absolute -bottom-4 -left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            GDPR Compliant
          </div>
        </div>
      </motion.div>
    </section>
  )
}