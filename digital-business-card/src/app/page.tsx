'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  QrCode, 
  Smartphone, 
  BarChart3, 
  Users, 
  Globe,
  CheckCircle2,
  Star,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: QrCode,
      title: 'Smart QR Codes',
      description: 'Generate dynamic QR codes that update automatically when you change your information',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Perfect viewing experience on all devices with PWA capabilities',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Track views, engagement, and networking performance with detailed insights',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage team cards, enforce branding, and track team performance',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Share your card worldwide with instant translation and localization',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'GDPR compliant with full control over your data and sharing preferences',
      color: 'from-teal-500 to-blue-500'
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Sales Director, TechCorp",
      content: "Increased my networking efficiency by 300%. The analytics help me follow up with the right contacts.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Real Estate Agent",
      content: "My clients love the instant contact sharing. It's professional and environmentally friendly.",
      rating: 5
    },
    {
      name: "Lisa Thompson",
      role: "Marketing Manager",
      content: "Team management features are incredible. We maintain brand consistency across all cards.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full backdrop-blur-md bg-white/70 border-b border-white/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <QrCode className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold gradient-text">BusinessCard.io</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-indigo-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-indigo-600 transition-colors">Reviews</a>
              <Button variant="outline" className="mr-2">Sign In</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Transform Your
                <span className="gradient-text block">Digital Networking</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Create stunning digital business cards with QR codes, track engagement with powerful analytics, 
                and build your professional network more effectively than ever before.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4">
                  Create Your Card Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="px-8 py-4">
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Setup in 2 minutes
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 animate-float">
                <Card className="card-shadow border-0 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                          <Users className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">John Smith</h3>
                          <p className="text-indigo-100">Senior Developer</p>
                        </div>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>📧 john@company.com</div>
                        <div>📱 +1 (555) 123-4567</div>
                        <div>🌐 johnsmith.dev</div>
                      </div>
                    </div>
                    <div className="bg-white p-6">
                      <div className="flex justify-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                          <QrCode className="h-16 w-16 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20 blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Everything You Need for Professional Networking
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Our platform combines cutting-edge technology with intuitive design to revolutionize 
              how professionals connect and share information.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="relative group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardContent className="p-8">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} p-3 mb-6 
                      transform transition-transform duration-300 ${hoveredFeature === index ? 'scale-110' : ''}`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 
                    group-hover:opacity-5 transition-opacity duration-300`} />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Trusted by Professionals Worldwide
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="border-0 shadow-lg h-full">
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Networking?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of professionals who have already made the switch to digital business cards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4">
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <QrCode className="h-8 w-8 text-indigo-400" />
                <span className="text-xl font-bold text-white">BusinessCard.io</span>
              </div>
              <p className="text-gray-400">
                The future of professional networking is here.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BusinessCard.io. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}