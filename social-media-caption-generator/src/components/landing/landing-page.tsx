'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { 
  Sparkles, 
  Zap, 
  Users, 
  BarChart3, 
  Palette, 
  Globe,
  ArrowRight,
  Check,
  Star
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const platforms = [
  { name: 'Instagram', color: 'from-pink-500 to-orange-500', users: '2B+' },
  { name: 'Facebook', color: 'from-blue-600 to-blue-700', users: '3B+' },
  { name: 'Twitter', color: 'from-sky-400 to-blue-500', users: '450M+' },
  { name: 'LinkedIn', color: 'from-blue-700 to-blue-800', users: '900M+' },
  { name: 'TikTok', color: 'from-gray-900 to-gray-700', users: '1B+' },
]

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Advanced AI creates engaging captions tailored to your brand voice and audience.',
  },
  {
    icon: Palette,
    title: 'Brand Voice Training',
    description: 'Train AI with your brand examples for consistent tone across all platforms.',
  },
  {
    icon: Globe,
    title: 'Multi-Platform Optimization',
    description: 'Platform-specific optimization for Instagram, Facebook, Twitter, LinkedIn, and TikTok.',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Track engagement rates and optimize your content strategy with detailed insights.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together with your team, share brand voices, and maintain consistency.',
  },
  {
    icon: Zap,
    title: 'Instant Generation',
    description: 'Generate multiple caption variations in seconds, not hours.',
  },
]

const pricing = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    captions: 20,
    features: [
      '20 captions per month',
      'Basic AI models',
      '2 brand voices',
      'Community support',
    ],
  },
  {
    name: 'Creator',
    price: 19,
    period: 'month',
    captions: 200,
    popular: true,
    features: [
      '200 captions per month',
      'Advanced AI models',
      '5 brand voices',
      'All platforms',
      'Priority generation',
      'Analytics dashboard',
    ],
  },
  {
    name: 'Professional',
    price: 49,
    period: 'month',
    captions: 1000,
    features: [
      '1,000 captions per month',
      'Unlimited brand voices',
      'API access',
      'Bulk generation',
      'Team collaboration',
      'Advanced analytics',
    ],
  },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Social Media Manager',
    company: 'TechStart Inc.',
    content: 'This tool has cut my content creation time by 80%. The brand voice consistency is incredible.',
    rating: 5,
  },
  {
    name: 'Mike Chen',
    role: 'Marketing Director',
    company: 'Fashion Forward',
    content: 'Our engagement rates increased by 40% after using AI-optimized captions. Game changer!',
    rating: 5,
  },
  {
    name: 'Emma Rodriguez',
    role: 'Content Creator',
    company: 'Freelance',
    content: 'Perfect for managing multiple client accounts. Each brand voice stays unique and authentic.',
    rating: 5,
  },
]

export function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Social Caption Generator
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => handleSignIn('google')}
              disabled={isLoading}
            >
              Sign In
            </Button>
            <Button
              onClick={() => handleSignIn('google')}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI-Powered Social Media Captions
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Generate engaging, platform-optimized captions in seconds. 
              Train AI with your brand voice and watch your engagement soar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={() => handleSignIn('google')}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
              >
                Start Creating Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4"
              >
                Watch Demo
              </Button>
            </div>

            {/* Platform Support */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {platforms.map((platform, index) => (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-r ${platform.color} text-white px-4 py-2 rounded-full text-sm font-medium`}
                >
                  {platform.name} ({platform.users})
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Our AI Caption Generator?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to save time and boost engagement across all your social media platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your content creation needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`h-full ${plan.popular ? 'ring-2 ring-blue-600 relative' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold">
                      ${plan.price}
                      <span className="text-lg font-normal text-gray-600">
                        /{plan.period}
                      </span>
                    </div>
                    <CardDescription>
                      {plan.captions} captions per month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <Check className="h-5 w-5 text-green-600 mr-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleSignIn('google')}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Loved by Content Creators</h2>
            <p className="text-xl text-gray-600">
              See what our users are saying about their results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Social Media?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of creators who save hours every week with AI-powered captions.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => handleSignIn('google')}
            disabled={isLoading}
            className="text-lg px-8 py-4"
          >
            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="h-6 w-6" />
            <span className="text-xl font-semibold">Social Caption Generator</span>
          </div>
          <p className="text-gray-400 mb-4">
            AI-powered social media caption generation for the modern creator.
          </p>
          <div className="text-sm text-gray-500">
            © 2024 Social Caption Generator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}