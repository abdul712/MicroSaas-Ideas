import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'CEO',
    company: 'TechFlow Solutions',
    industry: 'SaaS',
    image: '/api/placeholder/64/64',
    rating: 5,
    quote: 'TrendAnalyzer helped us identify a market opportunity that increased our revenue by 40% in just 6 months. The AI predictions were incredibly accurate.',
    results: '+40% Revenue Growth'
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Operations Director',
    company: 'RetailMax',
    industry: 'E-commerce',
    image: '/api/placeholder/64/64',
    rating: 5,
    quote: 'We used to make inventory decisions based on gut feeling. Now we use TrendAnalyzer\'s predictions and reduced our overstock by 60% while never running out of popular items.',
    results: '-60% Overstock Costs'
  },
  {
    name: 'Emma Thompson',
    role: 'Marketing Manager',
    company: 'GrowthLab',
    industry: 'Digital Marketing',
    image: '/api/placeholder/64/64',
    rating: 5,
    quote: 'The seasonal trend detection feature helped us time our campaigns perfectly. Our ROI improved by 85% because we knew exactly when to increase ad spend.',
    results: '+85% Marketing ROI'
  },
  {
    name: 'David Kim',
    role: 'Finance Director',
    company: 'InnovateCorp',
    industry: 'Manufacturing',
    image: '/api/placeholder/64/64',
    rating: 5,
    quote: 'The cash flow predictions have been a game-changer. We can now plan our investments and expansions with confidence, knowing exactly when money will come in.',
    results: '95% Prediction Accuracy'
  },
  {
    name: 'Lisa Park',
    role: 'Business Owner',
    company: 'Artisan Bakery',
    industry: 'Food & Beverage',
    image: '/api/placeholder/64/64',
    rating: 5,
    quote: 'As a small business owner, I was drowning in spreadsheets. TrendAnalyzer made sense of all my data and showed me patterns I never knew existed.',
    results: '+25% Profit Margin'
  },
  {
    name: 'Michael Brown',
    role: 'Head of Strategy',
    company: 'ConsultPro',
    industry: 'Consulting',
    image: '/api/placeholder/64/64',
    rating: 5,
    quote: 'We now offer data-driven insights to our clients using TrendAnalyzer. It\'s become our secret weapon for delivering exceptional results and winning new business.',
    results: '+50% Client Retention'
  }
]

export function Testimonials() {
  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            <Star className="h-4 w-4" />
            <span>Customer Success Stories</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              thousands
            </span>{' '}
            of businesses
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how businesses across industries are using TrendAnalyzer to make 
            smarter decisions and achieve remarkable growth.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary">5,000+</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary">95%</div>
            <div className="text-sm text-muted-foreground">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary">$50M+</div>
            <div className="text-sm text-muted-foreground">Revenue Generated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary">4.9/5</div>
            <div className="text-sm text-muted-foreground">Customer Rating</div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 space-y-4">
                {/* Rating */}
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <div className="relative">
                  <Quote className="h-6 w-6 text-primary/20 absolute -top-2 -left-1" />
                  <p className="text-muted-foreground leading-relaxed pl-6">
                    {testimonial.quote}
                  </p>
                </div>

                {/* Results Badge */}
                <Badge variant="success" className="w-fit">
                  {testimonial.results}
                </Badge>

                {/* Author */}
                <div className="flex items-center space-x-3 pt-4 border-t">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.industry}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-4">
            Join thousands of businesses making smarter decisions
          </h3>
          <p className="text-muted-foreground mb-6">
            Start your free trial today and see why businesses trust TrendAnalyzer 
            with their most important decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>4.9/5 rating from 1,200+ reviews</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>•</span>
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>•</span>
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}