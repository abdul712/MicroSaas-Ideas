'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Users, Shield, Zap, CheckCircle, Star } from 'lucide-react'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)

  const features = [
    {
      icon: <MessageSquare className="h-8 w-8 text-blue-600" />,
      title: "Real-time Messaging",
      description: "Instant messaging with typing indicators, read receipts, and seamless synchronization across all devices."
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Team Management",
      description: "Multi-tenant architecture with role-based permissions, team workspaces, and advanced member management."
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: "Enterprise Security",
      description: "End-to-end encryption, audit logs, SSO integration, and GDPR compliance for enterprise peace of mind."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "AI-Powered Assistant",
      description: "Smart message summarization, language translation, and automated insights for enhanced productivity."
    }
  ]

  const stats = [
    { label: "Message Delivery", value: "<100ms", suffix: "" },
    { label: "Uptime Guarantee", value: "99.9", suffix: "%" },
    { label: "Concurrent Users", value: "1000", suffix: "+" },
    { label: "Test Coverage", value: "90", suffix: "%" }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CTO, TechStartup",
      content: "Finally, a communication platform that doesn't overwhelm our team with unnecessary features.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Team Lead, Digital Agency",
      content: "The AI assistant has transformed how we handle meeting notes and follow-ups.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">TeamHub</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#security" className="text-gray-600 hover:text-gray-900 transition-colors">Security</a>
              <Button variant="outline">Sign In</Button>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 Enterprise-Grade Team Communication
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Centralize Your Team
            <span className="text-blue-600"> Communication</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Real-time messaging, AI assistance, and enterprise security in one platform. 
            Built for teams who need reliable communication without the complexity.
          </p>
          
          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" className="px-8 py-3 text-lg">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything your team needs
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Powerful features designed for modern team collaboration
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Trusted by teams worldwide
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-lg italic text-gray-700">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to transform your team communication?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Join thousands of teams already using TeamHub for better collaboration
          </p>
          <div className="mt-8 flex items-center justify-center gap-x-6">
            <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg text-white border-white hover:bg-white hover:text-blue-600">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <MessageSquare className="h-6 w-6 text-blue-400" />
                <span className="ml-2 text-lg font-bold">TeamHub</span>
              </div>
              <p className="text-gray-400">
                Enterprise team communication platform with AI assistance and real-time collaboration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TeamHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}