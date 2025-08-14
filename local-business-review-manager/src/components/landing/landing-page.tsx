"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, TrendingUp, Shield, Zap, Users, CheckCircle, ArrowRight } from "lucide-react";

export function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Multi-Platform Monitoring",
      description: "Monitor reviews across Google My Business, Facebook, Yelp, and TripAdvisor in one dashboard.",
    },
    {
      icon: Zap,
      title: "AI-Powered Responses",
      description: "Generate personalized responses using AI that matches your brand voice and tone.",
    },
    {
      icon: TrendingUp,
      title: "Sentiment Analysis",
      description: "Understand customer sentiment and identify trending topics in your reviews.",
    },
    {
      icon: Shield,
      title: "Reputation Protection",
      description: "Proactive monitoring and automated alerts for negative reviews and reputation threats.",
    },
    {
      icon: Users,
      title: "Review Invitations",
      description: "Automated email and SMS invitations to encourage positive reviews from satisfied customers.",
    },
    {
      icon: Star,
      title: "Local SEO Boost",
      description: "Improve your local search rankings with optimized review management strategies.",
    },
  ];

  const benefits = [
    "95% review platform coverage",
    "Sub-1 minute response alerts",
    "40% improvement in positive reviews",
    "Real-time reputation monitoring",
    "GDPR compliant data handling",
    "Enterprise-grade security",
  ];

  const platforms = [
    { name: "Google My Business", color: "bg-blue-500" },
    { name: "Facebook", color: "bg-blue-600" },
    { name: "Yelp", color: "bg-red-500" },
    { name: "TripAdvisor", color: "bg-green-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ReviewManager</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Button onClick={handleGoogleSignIn} disabled={isLoading} size="sm">
                {isLoading ? "Loading..." : "Get Started"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              🚀 Trusted by 1000+ local businesses
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Manage Your Online Reviews
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {" "}Like a Pro
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Monitor, respond, and optimize your online reputation across all major review platforms. 
              Use AI-powered insights to turn reviews into your competitive advantage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGoogleSignIn} 
                disabled={isLoading}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? "Loading..." : "Start Free Trial"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Support */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Works with all major review platforms
            </h2>
            <p className="text-gray-600">
              Centralized management for all your review channels
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {platforms.map((platform) => (
              <div key={platform.name} className="flex items-center space-x-3 bg-gray-50 px-6 py-3 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                <span className="font-medium text-gray-700">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage reviews
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to monitor, analyze, and improve your online reputation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Proven results for local businesses
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our platform helps businesses improve their online reputation and drive more customers 
                through intelligent review management.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Review Dashboard</h3>
                  <Badge className="bg-green-100 text-green-800">Live</Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm font-medium">Google My Business</span>
                    </div>
                    <span className="text-sm text-gray-600">4.8 ⭐</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium">TripAdvisor</span>
                    </div>
                    <span className="text-sm text-gray-600">4.6 ⭐</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-sm font-medium">Yelp</span>
                    </div>
                    <span className="text-sm text-gray-600">4.4 ⭐</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to transform your online reputation?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of local businesses that trust ReviewManager to grow their reputation and attract more customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-50"
            >
              {isLoading ? "Loading..." : "Start Your Free Trial"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
              Schedule Demo
            </Button>
          </div>
          <p className="text-blue-200 text-sm mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">ReviewManager</span>
              </div>
              <p className="text-gray-400 text-sm">
                Comprehensive review management for local businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 ReviewManager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}