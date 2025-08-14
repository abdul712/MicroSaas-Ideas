import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Clock,
  Rocket,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Calendar,
    title: "Advanced Scheduling",
    description: "Visual drag-and-drop calendar with optimal time suggestions and bulk operations"
  },
  {
    icon: Globe,
    title: "Multi-Platform Publishing",
    description: "WordPress, Medium, Dev.to, LinkedIn, Hashnode and more platforms"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Real-time editing, approval workflows, and role-based permissions"
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Cross-platform performance tracking and optimization recommendations"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant with encryption, audit logs, and GDPR compliance"
  },
  {
    icon: Zap,
    title: "AI-Powered Optimization",
    description: "Smart title suggestions, SEO optimization, and content enhancement"
  }
];

const platforms = [
  { name: "WordPress", logo: "🗞️" },
  { name: "Medium", logo: "📝" },
  { name: "Dev.to", logo: "👨‍💻" },
  { name: "LinkedIn", logo: "💼" },
  { name: "Hashnode", logo: "🔗" },
  { name: "Ghost", logo: "👻" }
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Content Marketing Manager",
    company: "TechCorp",
    content: "Reduced our publishing time by 80% and improved engagement across all platforms.",
    rating: 5
  },
  {
    name: "Mike Chen",
    role: "Blogger",
    company: "Personal Brand",
    content: "The scheduling intelligence helped me reach optimal posting times I never knew existed.",
    rating: 5
  },
  {
    name: "Jessica Davis",
    role: "Marketing Director",
    company: "StartupXYZ",
    content: "Team collaboration features transformed how our content team works together.",
    rating: 5
  }
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Blog Scheduler</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
              Login
            </Link>
            <Button asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            <Rocket className="h-4 w-4 mr-1" />
            Now Supporting 15+ Platforms
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Schedule Content Across Every Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Advanced content publishing platform that automates scheduling, optimizes posting times, 
            and manages editorial workflows with team collaboration features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/register">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">Watch Demo</Link>
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-60">
            {platforms.map((platform) => (
              <div key={platform.name} className="flex items-center space-x-2">
                <span className="text-2xl">{platform.logo}</span>
                <span className="text-sm font-medium">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Content Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From creation to analytics, manage your entire content workflow in one place
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Save 20+ Hours Per Week
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Stop manually posting to multiple platforms. Our intelligent scheduling system 
                handles everything while you focus on creating amazing content.
              </p>
              <div className="space-y-4">
                {[
                  "99.9% scheduled post delivery rate",
                  "60% time savings on content publishing",
                  "5000+ posts scheduled monthly by users",
                  "Enterprise-grade security and compliance"
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-6 w-6 text-primary" />
                  <span>Intelligent Scheduling</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="font-medium">Next Optimal Time</p>
                    <p className="text-sm text-muted-foreground">Tuesday, 2:00 PM EST</p>
                    <Badge variant="secondary" className="mt-2">+23% engagement</Badge>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-medium">Queue Status</p>
                    <p className="text-sm text-muted-foreground">12 posts scheduled this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Content Creators Worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of creators who trust our platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="relative">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Content Workflow?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start your free trial today and experience the power of automated content publishing
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/register">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 opacity-75">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-muted/30 border-t">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="font-bold">Blog Scheduler</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Advanced content publishing platform for modern creators.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="/integrations" className="text-muted-foreground hover:text-foreground">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="text-muted-foreground hover:text-foreground">Documentation</Link></li>
                <li><Link href="/support" className="text-muted-foreground hover:text-foreground">Help Center</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
                <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Blog Scheduler. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}