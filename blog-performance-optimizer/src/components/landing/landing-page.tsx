'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Search, 
  Shield, 
  BarChart3, 
  Clock, 
  Globe,
  CheckCircle,
  TrendingUp,
  Eye,
  Target
} from 'lucide-react';

export function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Performance Analysis",
      description: "Comprehensive Core Web Vitals monitoring and optimization recommendations"
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "SEO Optimization",
      description: "Technical SEO audits, meta tag optimization, and schema markup implementation"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Accessibility Compliance",
      description: "WCAG 2.1 compliance checking and automated accessibility improvements"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Real-time Monitoring",
      description: "24/7 uptime monitoring with performance degradation alerts"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Automated Optimization",
      description: "Automatic image optimization, caching strategies, and code improvements"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Performance",
      description: "Multi-location testing and CDN optimization recommendations"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Blog Owner",
      content: "Increased my blog's loading speed by 60% and saw a 40% boost in search rankings!",
      improvement: "60% faster loading"
    },
    {
      name: "Mike Chen",
      role: "Content Creator",
      content: "The automated SEO suggestions helped me fix issues I didn't even know existed.",
      improvement: "90+ SEO score"
    },
    {
      name: "Emily Rodriguez",
      role: "Digital Marketer",
      content: "Real-time monitoring gives me peace of mind. No more unexpected downtime!",
      improvement: "99.9% uptime"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">BlogOptimizer</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Testimonials</a>
            <Button variant="outline">Sign In</Button>
            <Button>Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            🚀 Website Speed & SEO Enhancement Platform
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Supercharge Your
            <span className="text-blue-600"> Blog Performance</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automatically analyze, monitor, and optimize your blog for speed, SEO, and accessibility. 
            Get real-time insights and automated fixes to boost your search rankings and user experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-4">
              Start Free Analysis
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>

          {/* Demo Dashboard Preview */}
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-sm text-gray-300">BlogOptimizer Dashboard</div>
                </div>
                <div className="bg-white p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Performance Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600 mb-2">94</div>
                        <Progress value={94} className="mb-2" />
                        <div className="text-sm text-gray-500">Excellent performance</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">SEO Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600 mb-2">87</div>
                        <Progress value={87} className="mb-2" />
                        <div className="text-sm text-gray-500">Good optimization</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Accessibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600 mb-2">96</div>
                        <Progress value={96} className="mb-2" />
                        <div className="text-sm text-gray-500">WCAG compliant</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Optimize Your Blog
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools and automated optimizations to improve your website's performance, 
              SEO rankings, and user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Blog Performance Matters
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <TrendingUp className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Higher Search Rankings</h3>
                    <p className="text-gray-600">Fast, optimized sites rank higher in Google search results</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Eye className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Better User Experience</h3>
                    <p className="text-gray-600">Improved loading speeds reduce bounce rates and increase engagement</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Target className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Increased Conversions</h3>
                    <p className="text-gray-600">Faster sites convert visitors to subscribers and customers more effectively</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Page Load Speed</span>
                    <Badge variant="success">60% improvement</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">1.2s</div>
                  <div className="text-sm text-gray-500">Average after optimization</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Search Visibility</span>
                    <Badge variant="success">40% increase</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">Top 3</div>
                  <div className="text-sm text-gray-500">Average ranking position</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">User Engagement</span>
                    <Badge variant="success">25% boost</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">4.2m</div>
                  <div className="text-sm text-gray-500">Average session duration</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Blog Owners Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See how BlogOptimizer has transformed websites and boosted their performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Badge variant="success" className="mr-2">
                      {testimonial.improvement}
                    </Badge>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <CheckCircle key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Optimize Your Blog?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start your free analysis today and see how much your blog can improve
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              Start Free Analysis
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-blue-600">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">BlogOptimizer</span>
              </div>
              <p className="text-gray-400">
                The ultimate platform for blog performance optimization and SEO enhancement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BlogOptimizer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}