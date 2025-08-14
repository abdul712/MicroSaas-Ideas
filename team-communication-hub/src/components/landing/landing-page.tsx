'use client'

import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { 
  MessageSquare, 
  Users, 
  Zap, 
  Shield, 
  Globe, 
  Bot,
  Video,
  FileText,
  Search,
  Bell
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Team Communication Hub</span>
          </div>
          <Button onClick={() => signIn()} variant="default">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Enterprise Team Communication
            <span className="text-blue-600 block">Reimagined</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Real-time messaging, AI-powered assistance, and enterprise security. 
            Built for modern teams who demand more than just chat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => signIn()}>
              Get Started Free
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Free for teams up to 5 members • No credit card required
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything Your Team Needs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8 text-blue-600" />}
              title="Real-time Messaging"
              description="Instant messaging with channels, threads, and direct messages. Never miss a beat."
            />
            <FeatureCard
              icon={<Bot className="h-8 w-8 text-purple-600" />}
              title="AI Assistant"
              description="Smart summaries, translations, and conversation insights powered by AI."
            />
            <FeatureCard
              icon={<Video className="h-8 w-8 text-green-600" />}
              title="Video Conferencing"
              description="Built-in video calls and screen sharing for seamless collaboration."
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8 text-orange-600" />}
              title="File Sharing"
              description="Secure file uploads with previews and collaborative editing."
            />
            <FeatureCard
              icon={<Search className="h-8 w-8 text-red-600" />}
              title="Powerful Search"
              description="Find any message, file, or conversation instantly with semantic search."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-indigo-600" />}
              title="Enterprise Security"
              description="End-to-end encryption, SSO, and compliance features for peace of mind."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard number="99.9%" label="Uptime SLA" />
            <StatCard number="<100ms" label="Message Latency" />
            <StatCard number="1000+" label="Concurrent Users" />
            <StatCard number="SOC 2" label="Security Certified" />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <PricingCard
              title="Free"
              price="$0"
              period="forever"
              features={[
                "Up to 5 team members",
                "10GB storage",
                "30-day message history",
                "Basic integrations",
                "Community support"
              ]}
              isPopular={false}
            />
            <PricingCard
              title="Starter"
              price="$5"
              period="per user/month"
              features={[
                "Up to 25 team members",
                "100GB storage",
                "Unlimited message history",
                "All integrations",
                "Priority support",
                "Video conferencing"
              ]}
              isPopular={true}
            />
            <PricingCard
              title="Professional"
              price="$10"
              period="per user/month"
              features={[
                "Unlimited team members",
                "500GB storage",
                "Advanced admin controls",
                "Custom integrations",
                "SLA guarantee",
                "AI assistant included",
                "Advanced analytics"
              ]}
              isPopular={false}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Team Communication?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using Team Communication Hub to boost productivity and collaboration.
          </p>
          <Button size="lg" variant="secondary" onClick={() => signIn()}>
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-6 w-6" />
                <span className="font-bold">Team Communication Hub</span>
              </div>
              <p className="text-gray-400">
                Enterprise-grade team collaboration platform built for modern teams.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Security</li>
                <li>Integrations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Careers</li>
                <li>Blog</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Status</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Team Communication Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="p-6">
      <div className="text-3xl font-bold text-blue-600 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  )
}

function PricingCard({ 
  title, 
  price, 
  period, 
  features, 
  isPopular 
}: {
  title: string
  price: string
  period: string
  features: string[]
  isPopular: boolean
}) {
  return (
    <div className={`p-8 rounded-lg border-2 ${
      isPopular 
        ? 'border-blue-600 bg-blue-50' 
        : 'border-gray-200 bg-white'
    } relative`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
          Most Popular
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <div className="mb-6">
        <span className="text-3xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-600 ml-1">/{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-600">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-3 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <Button 
        className="w-full" 
        variant={isPopular ? "default" : "outline"}
        onClick={() => signIn()}
      >
        Get Started
      </Button>
    </div>
  )
}