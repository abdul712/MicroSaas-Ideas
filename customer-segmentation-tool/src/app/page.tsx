import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Brain, 
  BarChart3, 
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Shield
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SegmentAI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-background to-secondary/20">
        <div className="container-responsive">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered Segmentation
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Smart Customer Segmentation
              <span className="text-gradient"> with AI</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your marketing with intelligent customer segmentation. 
              Use machine learning to discover hidden patterns, predict behavior, 
              and create highly targeted campaigns that convert.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="group">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </Link>
            </div>
            <div className="mt-8 text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for smart segmentation
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform combines the power of AI with intuitive design to help you 
              understand and target your customers like never before.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-hover">
              <CardHeader>
                <Brain className="w-10 h-10 text-primary mb-2" />
                <CardTitle>AI-Powered Clustering</CardTitle>
                <CardDescription>
                  Advanced machine learning algorithms automatically discover customer segments 
                  based on behavior, demographics, and purchase patterns.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <BarChart3 className="w-10 h-10 text-primary mb-2" />
                <CardTitle>RFM Analysis</CardTitle>
                <CardDescription>
                  Analyze customer value using Recency, Frequency, and Monetary metrics 
                  to identify your most valuable segments.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Predictive Analytics</CardTitle>
                <CardDescription>
                  Predict customer churn, lifetime value, and next best actions 
                  to optimize your marketing strategy.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <Target className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Smart Targeting</CardTitle>
                <CardDescription>
                  Export segments to your favorite marketing platforms or trigger 
                  automated campaigns based on real-time behavior.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <Zap className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Real-time Updates</CardTitle>
                <CardDescription>
                  Segments update automatically as customer behavior changes, 
                  ensuring your targeting stays relevant.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <Shield className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  GDPR and CCPA compliant with enterprise-grade security, 
                  audit logs, and role-based access control.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-secondary/20">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why leading brands choose SegmentAI
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Increase conversion rates by 40%</h3>
                    <p className="text-muted-foreground">
                      Highly targeted segments lead to more relevant messaging and better results.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Reduce customer acquisition costs</h3>
                    <p className="text-muted-foreground">
                      Focus your marketing spend on the segments most likely to convert.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Discover hidden opportunities</h3>
                    <p className="text-muted-foreground">
                      AI reveals customer patterns you never knew existed.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Save hours of manual analysis</h3>
                    <p className="text-muted-foreground">
                      Automated segmentation runs continuously in the background.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-8 border">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg italic mb-4">
                  "SegmentAI helped us increase our email campaign performance by 60% 
                  and identify our most valuable customer segments. The AI insights are incredible."
                </blockquote>
                <cite className="text-sm text-muted-foreground">
                  — Sarah Johnson, Marketing Director at TechCorp
                </cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-24">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Integrates with your favorite tools
            </h2>
            <p className="text-xl text-muted-foreground">
              Connect your existing data sources and marketing platforms in minutes.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
            <div className="text-center">
              <div className="bg-card border rounded-lg p-6 mb-2">
                <span className="font-semibold">Shopify</span>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-card border rounded-lg p-6 mb-2">
                <span className="font-semibold">Stripe</span>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-card border rounded-lg p-6 mb-2">
                <span className="font-semibold">Mailchimp</span>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-card border rounded-lg p-6 mb-2">
                <span className="font-semibold">HubSpot</span>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-card border rounded-lg p-6 mb-2">
                <span className="font-semibold">Salesforce</span>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-card border rounded-lg p-6 mb-2">
                <span className="font-semibold">Klaviyo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container-responsive text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to transform your marketing?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of marketers who are already using AI-powered segmentation 
            to drive better results and grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="group">
                Start Your Free Trial
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Talk to Sales
              </Button>
            </Link>
          </div>
          <div className="mt-6 text-sm opacity-80">
            14-day free trial • No setup fees • Cancel anytime
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16">
        <div className="container-responsive">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">SegmentAI</span>
              </div>
              <p className="text-muted-foreground mb-4">
                AI-powered customer segmentation for smarter marketing decisions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-foreground">Integrations</Link></li>
                <li><Link href="/api" className="hover:text-foreground">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
                <li><Link href="/gdpr" className="hover:text-foreground">GDPR</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 SegmentAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}