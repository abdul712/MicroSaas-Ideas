'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, ArrowRightIcon, FileTextIcon, UsersIcon, BarChart3Icon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileTextIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">ProcessDoc</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
            <Link href="/auth/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 AI-Powered Process Documentation
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Business
            <span className="text-blue-600"> Processes</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create, manage, and optimize your workflows with visual process mapping, 
            step-by-step guides, and compliance tracking. Turn tribal knowledge into 
            actionable procedures.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools for documenting, managing, and optimizing your business processes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileTextIcon className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Visual Process Mapping</CardTitle>
                <CardDescription>
                  Create intuitive flowcharts and process diagrams with drag-and-drop interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    BPMN 2.0 compliance
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Real-time collaboration
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Template library
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <UsersIcon className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Work together seamlessly with version control and approval workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Role-based permissions
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Change tracking
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Comments & reviews
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3Icon className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>
                  Track process performance and identify optimization opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Execution tracking
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Bottleneck analysis
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Performance metrics
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <ShieldCheckIcon className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Compliance & Audit</CardTitle>
                <CardDescription>
                  Ensure regulatory compliance with comprehensive audit trails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Audit trail tracking
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Compliance reporting
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Document control
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileTextIcon className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Rich Documentation</CardTitle>
                <CardDescription>
                  Create comprehensive SOPs with multimedia content and interactive guides
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Rich text editor
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Media embedding
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Interactive checklists
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <ArrowRightIcon className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Workflow Automation</CardTitle>
                <CardDescription>
                  Automate process execution and notifications for improved efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Task automation
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Email notifications
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Integration APIs
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your organization</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Perfect for small teams</CardDescription>
                <div className="text-3xl font-bold">$39<span className="text-lg font-normal">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Up to 10 users
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    50 processes
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Basic templates
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Email support
                  </li>
                </ul>
                <Button className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>

            <Card className="border-blue-600 shadow-lg">
              <CardHeader>
                <Badge className="w-fit mb-2">Most Popular</Badge>
                <CardTitle>Professional</CardTitle>
                <CardDescription>For growing organizations</CardDescription>
                <div className="text-3xl font-bold">$99<span className="text-lg font-normal">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Up to 50 users
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Unlimited processes
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    All templates
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Advanced analytics
                  </li>
                </ul>
                <Button className="w-full mt-6">Start Free Trial</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
                <div className="text-3xl font-bold">$299<span className="text-lg font-normal">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Unlimited users
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Custom templates
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    API access
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    SSO/SAML
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    Dedicated support
                  </li>
                </ul>
                <Button className="w-full mt-6">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Processes?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of organizations already using ProcessDoc
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Your Free Trial
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileTextIcon className="h-6 w-6" />
              <span className="text-lg font-bold">ProcessDoc</span>
            </div>
            <p className="text-gray-400">© 2024 ProcessDoc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}