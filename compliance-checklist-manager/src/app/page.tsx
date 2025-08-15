import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  FileText, 
  BarChart3,
  Zap,
  Lock,
  Clock,
  Award,
  ArrowRight,
  Star
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Compliance Manager</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </nav>
          <Button asChild className="md:hidden">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6">
              🚀 AI-Powered Compliance Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Turn Compliance into a{' '}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Competitive Advantage
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              Stay 100% compliant with automated, industry-specific checklists that update with changing regulations. 
              Reduce audit preparation time by 80% and eliminate compliance-related fines.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/auth/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link href="/demo">
                  Watch Demo
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-500" />
                <span>SOC 2 compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <span>500+ organizations</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]">
            <div className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-primary/20 to-secondary/20 opacity-20" 
                 style={{
                   clipPath: 'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)'
                 }}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Compliance Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">80%</div>
              <div className="text-sm text-muted-foreground">Time Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Organizations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">$2M+</div>
              <div className="text-sm text-muted-foreground">Fines Prevented</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for compliance management
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comprehensive tools to manage regulatory requirements, track compliance status, and prepare for audits.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                  <ul className="mt-4 space-y-2">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Industry-Specific Compliance
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Pre-built compliance frameworks for your industry with automatic updates.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry, index) => (
              <Card key={index} className="text-center transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <div className="mx-auto rounded-full bg-primary/10 p-4 w-fit">
                    <industry.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>{industry.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {industry.regulations.map((regulation, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {regulation}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to transform your compliance?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join hundreds of organizations that trust us with their compliance management.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold">Compliance Manager</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered compliance management platform for regulatory tracking and audit readiness.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-foreground">Demo</Link></li>
                <li><Link href="/api-docs" className="hover:text-foreground">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
                <li><Link href="/compliance" className="hover:text-foreground">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Compliance Checklist Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: CheckCircle,
    title: 'Smart Checklists',
    description: 'Industry-specific compliance checklists that adapt to your business and update automatically with regulation changes.',
    highlights: [
      'Pre-built industry templates',
      'Custom requirement creation',
      'Automatic regulation updates',
      'Conditional logic support'
    ]
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Assign tasks, track progress, and collaborate with your team to ensure nothing falls through the cracks.',
    highlights: [
      'Role-based access control',
      'Task assignment & tracking',
      'Real-time notifications',
      'Team performance analytics'
    ]
  },
  {
    icon: FileText,
    title: 'Evidence Management',
    description: 'Centralized document storage with version control and automatic evidence linking to requirements.',
    highlights: [
      'Secure document storage',
      'Version control',
      'Automatic categorization',
      'Audit-ready organization'
    ]
  },
  {
    icon: BarChart3,
    title: 'Compliance Analytics',
    description: 'Real-time dashboards and reports to monitor compliance status and identify potential risks.',
    highlights: [
      'Real-time compliance scoring',
      'Risk trend analysis',
      'Custom report builder',
      'Executive dashboards'
    ]
  },
  {
    icon: AlertTriangle,
    title: 'Risk Management',
    description: 'Identify, assess, and mitigate compliance risks before they become costly violations.',
    highlights: [
      'Automated risk scoring',
      'Mitigation tracking',
      'Predictive analytics',
      'Impact assessment'
    ]
  },
  {
    icon: Award,
    title: 'Audit Readiness',
    description: 'Generate comprehensive audit reports and evidence packages with one click.',
    highlights: [
      'One-click audit reports',
      'Evidence compilation',
      'Historical compliance data',
      'Gap analysis tools'
    ]
  }
];

const industries = [
  {
    icon: Shield,
    name: 'Healthcare',
    regulations: ['HIPAA', 'HITECH', 'FDA', 'Joint Commission']
  },
  {
    icon: Lock,
    name: 'Financial Services',
    regulations: ['SOX', 'PCI-DSS', 'GDPR', 'Basel III']
  },
  {
    icon: Zap,
    name: 'Manufacturing',
    regulations: ['OSHA', 'EPA', 'ISO 9001', 'ISO 14001']
  },
  {
    icon: FileText,
    name: 'Food Service',
    regulations: ['FDA', 'HACCP', 'Health Codes', 'USDA']
  },
  {
    icon: Users,
    name: 'Technology',
    regulations: ['GDPR', 'CCPA', 'SOC 2', 'ISO 27001']
  },
  {
    icon: Clock,
    name: 'Construction',
    regulations: ['OSHA', 'EPA', 'Building Codes', 'Safety Standards']
  }
];