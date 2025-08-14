import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Palette, 
  Users, 
  FileText, 
  MessageSquare, 
  Zap,
  CheckCircle,
  ArrowRight,
  Globe,
  Lock
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Globe className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">PortalCraft</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="#contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
          </nav>
          <div className="flex space-x-2">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6" variant="secondary">
            <Zap className="h-4 w-4 mr-2" />
            Professional Client Portals in Minutes
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Build Professional Client Portals Without Code
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create secure, branded client portals that impress your clients and streamline your business. 
            Perfect for agencies, consultants, and service providers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="min-w-[200px]">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need for Professional Client Portals</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to enhance your client relationships and streamline your workflow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg w-fit">
                  <Palette className="h-6 w-6" />
                </div>
                <CardTitle>Drag & Drop Builder</CardTitle>
                <CardDescription>
                  Create stunning portals with our intuitive drag-and-drop interface. No coding required.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-green-100 text-green-600 p-3 rounded-lg w-fit">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-level security with SSL encryption, two-factor authentication, and detailed access controls.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 text-purple-600 p-3 rounded-lg w-fit">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>
                  Manage multiple clients with ease. Role-based permissions and organized project spaces.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 text-orange-600 p-3 rounded-lg w-fit">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle>Secure File Sharing</CardTitle>
                <CardDescription>
                  Share files securely with version control, download tracking, and expiring links.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-cyan-100 text-cyan-600 p-3 rounded-lg w-fit">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle>Communication Hub</CardTitle>
                <CardDescription>
                  Built-in messaging, comments, and notifications keep everyone on the same page.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-pink-100 text-pink-600 p-3 rounded-lg w-fit">
                  <Lock className="h-6 w-6" />
                </div>
                <CardTitle>White Label Ready</CardTitle>
                <CardDescription>
                  Custom domains, full branding control, and remove our branding for a seamless experience.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Impress Your Clients?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of professionals who use PortalCraft to deliver exceptional client experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="min-w-[200px]">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-4 opacity-75">14-day free trial • No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <Globe className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold">PortalCraft</span>
              </div>
              <p className="text-gray-400">
                Professional client portals made simple.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><Link href="#demo">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#help">Help Center</Link></li>
                <li><Link href="#contact">Contact</Link></li>
                <li><Link href="#docs">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#about">About</Link></li>
                <li><Link href="#privacy">Privacy</Link></li>
                <li><Link href="#terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PortalCraft. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}