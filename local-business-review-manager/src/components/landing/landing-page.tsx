'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Star, 
  Shield, 
  Zap, 
  BarChart3, 
  MessageSquare, 
  Bell,
  CheckCircle,
  ArrowRight,
  Users,
  Globe,
  TrendingUp,
  Award,
  Brain,
  Smartphone,
  Clock,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Multi-Platform Monitoring",
      description: "Track reviews across Google, Facebook, Yelp, TripAdvisor, and more from one dashboard.",
      stats: "15+ Platforms"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Responses",
      description: "Generate personalized, brand-consistent responses using advanced AI technology.",
      stats: "95% Accuracy"
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Real-Time Alerts",
      description: "Get instant notifications for new reviews, especially negative ones that need immediate attention.",
      stats: "< 1 Min Alert"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Advanced Analytics",
      description: "Deep insights into review trends, sentiment analysis, and reputation impact on your business.",
      stats: "50+ Metrics"
    }
  ]

  const platforms = [
    { name: "Google My Business", color: "bg-blue-500", users: "4B+" },
    { name: "Facebook", color: "bg-blue-600", users: "3B+" },
    { name: "Yelp", color: "bg-red-500", users: "178M+" },
    { name: "TripAdvisor", color: "bg-green-500", users: "460M+" },
    { name: "Trustpilot", color: "bg-green-600", users: "120M+" },
    { name: "Amazon", color: "bg-orange-500", users: "300M+" }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Restaurant Owner",
      business: "The Golden Spoon",
      content: "Our review response time went from days to minutes. Customer satisfaction increased by 40% in just 2 months.",
      rating: 5,
      image: "/api/placeholder/60/60"
    },
    {
      name: "Michael Chen",
      role: "Hotel Manager",
      business: "Seaside Resort",
      content: "The AI responses are so natural, our guests think we personally wrote each one. It's saved us 20 hours per week.",
      rating: 5,
      image: "/api/placeholder/60/60"
    },
    {
      name: "Emily Davis",
      role: "Dental Practice Owner",
      business: "Bright Smiles Clinic",
      content: "Managing reviews across 3 locations was a nightmare. Now it's seamless, and our online reputation has never been better.",
      rating: 5,
      image: "/api/placeholder/60/60"
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "per month",
      description: "Perfect for single-location businesses",
      features: [
        "1 Business Location",
        "3 Team Members",
        "Basic Review Monitoring",
        "Email Notifications",
        "Standard Support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$79",
      period: "per month",
      description: "Ideal for growing businesses",
      features: [
        "5 Business Locations",
        "10 Team Members",
        "AI Response Generation",
        "Real-time Notifications",
        "Advanced Analytics",
        "Priority Support"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "per month",
      description: "For large businesses and agencies",
      features: [
        "Unlimited Locations",
        "Unlimited Team Members",
        "White-label Solution",
        "Custom Integrations",
        "Dedicated Account Manager",
        "24/7 Premium Support"
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Star className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">ReviewManager</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
              <Button variant="ghost">Sign In</Button>
              <Button>Start Free Trial</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="mx-auto max-w-4xl text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div 
              className="mb-8 inline-flex items-center rounded-full border px-3 py-1 text-sm"
              variants={fadeInUp}
            >
              <Zap className="mr-2 h-4 w-4 text-yellow-500" />
              Trusted by 10,000+ businesses worldwide
            </motion.div>
            
            <motion.h1 
              className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl"
              variants={fadeInUp}
            >
              Transform Your Online Reputation with{' '}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Review Management
            </motion.h1>
            
            <motion.p 
              className="mb-8 text-xl text-muted-foreground"
              variants={fadeInUp}
            >
              Monitor, manage, and improve your business reviews across all major platforms. 
              Respond faster, rank higher, and build trust with every customer interaction.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <Button size="lg" className="text-lg px-8 py-6">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </motion.div>
            
            <motion.div 
              className="mt-12 text-sm text-muted-foreground"
              variants={fadeInUp}
            >
              No credit card required • 14-day free trial • Cancel anytime
            </motion.div>
          </motion.div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-[800px] w-[800px] rounded-full bg-gradient-to-r from-primary/20 to-blue-600/20 blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Platform Showcase */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-2xl font-bold mb-4">Monitor Reviews Across All Major Platforms</h2>
            <p className="text-muted-foreground">Connect with platforms where your customers leave reviews</p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                className="bg-background rounded-lg p-6 text-center shadow-sm border hover:shadow-md transition-shadow"
                variants={fadeInUp}
              >
                <div className={`w-12 h-12 rounded-lg ${platform.color} mx-auto mb-3 flex items-center justify-center`}>
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{platform.name}</h3>
                <p className="text-xs text-muted-foreground">{platform.users} users</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Manage Your Reputation</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive tools designed to help local businesses monitor, respond to, and improve their online reviews
            </p>
          </motion.div>

          <motion.div 
            className="grid lg:grid-cols-2 gap-12 items-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className={`p-6 rounded-lg border cursor-pointer transition-all ${
                    activeFeature === index ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                  }`}
                  variants={fadeInUp}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      activeFeature === index ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{feature.title}</h3>
                        <span className="text-sm font-medium text-primary">{feature.stats}</span>
                      </div>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              className="relative"
              variants={fadeInUp}
            >
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-lg border-2 border-dashed border-primary/20 flex items-center justify-center">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Interactive Feature Demo</p>
                  <p className="text-muted-foreground">Live dashboard preview</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold mb-4">Why Local Businesses Choose ReviewManager</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of businesses improving their online reputation
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: <Clock className="h-8 w-8 text-green-500" />,
                title: "Save 20+ Hours/Week",
                description: "Automate review responses and monitoring tasks"
              },
              {
                icon: <TrendingUp className="h-8 w-8 text-blue-500" />,
                title: "40% More Reviews",
                description: "Increase review volume with targeted campaigns"
              },
              {
                icon: <Star className="h-8 w-8 text-yellow-500" />,
                title: "Higher Star Ratings",
                description: "Improve average rating by addressing issues quickly"
              },
              {
                icon: <Users className="h-8 w-8 text-purple-500" />,
                title: "Better Customer Trust",
                description: "Build stronger relationships through engagement"
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="text-center"
                variants={fadeInUp}
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold mb-4">Loved by Business Owners</h2>
            <p className="text-xl text-muted-foreground">
              See how ReviewManager has transformed businesses like yours
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-muted"></div>
                      <div>
                        <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.role}, {testimonial.business}</CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-1 mt-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your business needs
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
              >
                <Card className={`relative h-full ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full mt-8 ${plan.popular ? 'bg-primary' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Start Free Trial
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Online Reputation?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of businesses that trust ReviewManager to manage their online presence
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Schedule Demo
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-500" />
                SSL Secured
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-2 text-blue-500" />
                GDPR Compliant
              </div>
              <div className="flex items-center">
                <Smartphone className="h-4 w-4 mr-2 text-purple-500" />
                Mobile Ready
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Star className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold">ReviewManager</span>
              </div>
              <p className="text-muted-foreground text-sm">
                The complete solution for managing your business reviews and online reputation.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ReviewManager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}