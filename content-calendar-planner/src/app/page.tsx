import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Users, Zap, BarChart3, Palette, Globe, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { LoginButton } from "@/components/auth/login-button"

const features = [
  {
    icon: CalendarDays,
    title: "Visual Content Calendar",
    description: "Drag-and-drop interface with monthly, weekly, and daily views. See your entire content strategy at a glance."
  },
  {
    icon: Globe,
    title: "Multi-Platform Publishing",
    description: "Schedule to Facebook, Instagram, Twitter, LinkedIn, TikTok, and YouTube from one dashboard."
  },
  {
    icon: Zap,
    title: "AI-Powered Content",
    description: "Generate captions, hashtags, and content ideas with built-in AI assistance."
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Real-time collaboration with comments, approvals, and role-based permissions."
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track performance across platforms with unified analytics and insights."
  },
  {
    icon: Palette,
    title: "Content Templates",
    description: "Pre-built templates and brand kits to maintain consistency across campaigns."
  }
]

const platforms = [
  { name: "Facebook", color: "bg-facebook", icon: "📘" },
  { name: "Instagram", color: "bg-instagram", icon: "📷" },
  { name: "Twitter", color: "bg-twitter", icon: "🐦" },
  { name: "LinkedIn", color: "bg-linkedin", icon: "💼" },
  { name: "TikTok", color: "bg-tiktok", icon: "🎵" },
  { name: "YouTube", color: "bg-youtube", icon: "📺" }
]

const benefits = [
  "Save 10+ hours per week on content planning",
  "Increase engagement with optimal posting times",
  "Maintain brand consistency across platforms",
  "Collaborate seamlessly with team members",
  "Track ROI with comprehensive analytics",
  "Scale content production efficiently"
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Content Calendar Planner</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="/features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <LoginButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            🚀 Now with AI-powered content generation
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Plan Your Content Visually,<br />
            Publish Everywhere Seamlessly
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The all-in-one content calendar that makes social media planning as easy as moving cards on a board. 
            Collaborate with your team and never miss a posting deadline again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <LoginButton variant="default" size="lg" className="px-8">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </LoginButton>
            <Button variant="outline" size="lg" asChild>
              <Link href="/demo">Watch Demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Free 14-day trial • No credit card required • Cancel anytime
          </p>
        </div>

        {/* Platform Badges */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {platforms.map((platform) => (
            <Badge key={platform.name} variant="outline" className="px-3 py-1.5">
              <span className="mr-2">{platform.icon}</span>
              {platform.name}
            </Badge>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need to Scale Your Content</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From planning to publishing to performance tracking, we've got every step of your content workflow covered.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
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
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Why Teams Choose Content Calendar Planner
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <LoginButton size="lg">
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </LoginButton>
              </div>
            </div>
            <div className="relative">
              <Card className="p-6 shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarDays className="h-5 w-5" />
                    <span>Content Calendar</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-7 gap-1 text-xs text-center font-medium text-muted-foreground">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="py-2">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div key={i} className="aspect-square border rounded p-1 text-xs">
                        {i % 7 === 1 && (
                          <div className="bg-blue-100 text-blue-800 rounded px-1 py-0.5 text-[10px] truncate">
                            Post
                          </div>
                        )}
                        {i % 7 === 3 && (
                          <div className="bg-green-100 text-green-800 rounded px-1 py-0.5 text-[10px] truncate">
                            Story
                          </div>
                        )}
                        {i % 7 === 5 && (
                          <div className="bg-purple-100 text-purple-800 rounded px-1 py-0.5 text-[10px] truncate">
                            Reel
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Content Strategy?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of content creators and marketing teams who trust Content Calendar Planner 
            to streamline their workflow and grow their audience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LoginButton size="lg" className="px-8">
              Start Your Free Trial
            </LoginButton>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <CalendarDays className="h-6 w-6 text-primary" />
              <span className="font-bold">Content Calendar Planner</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/support" className="hover:text-foreground">Support</Link>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
            © 2024 Content Calendar Planner. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}