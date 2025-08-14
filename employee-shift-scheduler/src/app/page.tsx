import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CalendarDays, 
  Users, 
  Clock, 
  TrendingUp, 
  Shield, 
  Smartphone,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <CalendarDays className="h-6 w-6 mr-2" />
          <span className="font-bold text-xl">ShiftSync</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/features"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/pricing"
          >
            Pricing
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/about"
          >
            About
          </Link>
        </nav>
        <div className="ml-4 flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Smart Employee Scheduling
                <span className="text-primary"> Made Simple</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Create optimal employee schedules in minutes, not hours. Automatically balance staff availability 
                with business needs while keeping your team happy and compliant with labor laws.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/demo">Watch Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Everything You Need for Workforce Management
            </h2>
            <p className="mt-4 text-gray-500 md:text-xl dark:text-gray-400">
              Powerful features designed for modern businesses
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <Card>
              <CardHeader>
                <CalendarDays className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Intelligent Scheduling</CardTitle>
                <CardDescription>
                  AI-powered scheduling that considers availability, skills, and business requirements
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>
                  Complete employee profiles with skills tracking, availability, and performance metrics
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Time Tracking</CardTitle>
                <CardDescription>
                  Built-in time clock with GPS verification and automated break tracking
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Labor Cost Optimization</CardTitle>
                <CardDescription>
                  Real-time labor cost tracking with overtime alerts and budget management
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Compliance Monitoring</CardTitle>
                <CardDescription>
                  Automated compliance checking for labor laws, breaks, and overtime regulations
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Smartphone className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Mobile First</CardTitle>
                <CardDescription>
                  Native mobile apps for managers and employees with offline capability
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Reduce Scheduling Time by 75%
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Stop spending hours on scheduling. Our intelligent system creates optimal schedules 
                  in minutes while ensuring fair distribution and compliance.
                </p>
              </div>
              <ul className="grid gap-2 py-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>15% reduction in labor costs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>40% decrease in employee turnover</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>90% improvement in schedule accuracy</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>100% labor law compliance</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="grid gap-4 w-full max-w-sm">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl text-center text-green-600">75%</CardTitle>
                    <CardDescription className="text-center">
                      Less time spent on scheduling
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl text-center text-blue-600">$2,400</CardTitle>
                    <CardDescription className="text-center">
                      Average monthly savings
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl text-center text-purple-600">99.9%</CardTitle>
                    <CardDescription className="text-center">
                      Uptime reliability
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Ready to Transform Your Scheduling?
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-200 md:text-xl">
                Join thousands of businesses already using ShiftSync to optimize their workforce management.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/register">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 ShiftSync. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}