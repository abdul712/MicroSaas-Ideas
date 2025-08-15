'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles, Zap, Shield, BarChart, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: <Sparkles className="w-8 h-8 text-purple-600" />,
      title: 'AI-Powered Generation',
      description: 'Advanced AI models trained on millions of high-performing social media posts',
    },
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: 'Platform Optimization',
      description: 'Captions optimized for Instagram, Facebook, Twitter, LinkedIn, TikTok and more',
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: 'Brand Voice Training',
      description: 'Train custom brand voices that maintain consistency across all your content',
    },
    {
      icon: <BarChart className="w-8 h-8 text-orange-600" />,
      title: 'Performance Analytics',
      description: 'Track engagement metrics and optimize your content strategy with data',
    },
    {
      icon: <Users className="w-8 h-8 text-pink-600" />,
      title: 'Team Collaboration',
      description: 'Collaborate with your team and manage multiple brand voices in one place',
    },
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '20 captions per month',
        '2 brand voices',
        'Basic analytics',
        'Community support',
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Creator',
      price: '$19',
      period: 'month',
      description: 'For content creators and small businesses',
      features: [
        '200 captions per month',
        '5 brand voices',
        'All platforms',
        'Priority generation',
        'Advanced analytics',
        'Email support',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Professional',
      price: '$49',
      period: 'month',
      description: 'For growing businesses and agencies',
      features: [
        '1,000 captions per month',
        'Unlimited brand voices',
        'API access',
        'Bulk generation',
        'Team collaboration',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Agency',
      price: '$149',
      period: 'month',
      description: 'For large teams and agencies',
      features: [
        '5,000 captions per month',
        'White-label option',
        'Custom AI training',
        'Dedicated support',
        'Advanced integrations',
        'Custom reporting',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <span className="text-xl font-bold text-gray-900">CaptionGenius</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-purple-600 transition-colors">Pricing</a>
            <a href="#examples" className="text-gray-600 hover:text-purple-600 transition-colors">Examples</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link 
              href="/auth/signin" 
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-6">
            <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              🚀 Generate scroll-stopping captions in seconds
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            AI-Powered Social Media
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600"> Caption Generator</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Generate engaging, platform-optimized captions that drive engagement. 
            Train custom brand voices, analyze performance, and scale your content creation with AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/signup"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              Start Generating Free <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors">
              Watch Demo
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>10,000+ creators</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>1M+ captions generated</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>40% engagement increase</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to create amazing content
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From AI generation to performance tracking, we've got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works for you. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`p-6 rounded-xl border-2 bg-white relative ${
                  plan.popular 
                    ? 'border-purple-600 shadow-lg scale-105' 
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to transform your social media?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of creators and businesses using CaptionGenius to grow their social media presence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              Start Your Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-bold text-white">CaptionGenius</span>
            </div>
            
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CaptionGenius. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}