'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'VP of Growth',
      company: 'TechFlow',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
      content: 'Journey Mapper transformed how we understand our customers. We increased conversion rates by 34% in just 3 months by identifying and fixing critical drop-off points.',
      rating: 5
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Director of Analytics',
      company: 'RetailPro',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
      content: 'The AI insights are game-changing. Instead of guessing what to optimize, we now have data-driven recommendations that actually work. ROI was positive within the first month.',
      rating: 5
    },
    {
      name: 'Emily Watson',
      role: 'Head of CX',
      company: 'FinanceFirst',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
      content: 'Finally, a tool that shows the complete customer journey across all our touchpoints. The visualizations make it easy to communicate insights to stakeholders.',
      rating: 5
    },
    {
      name: 'David Park',
      role: 'Senior Product Manager',
      company: 'StreamlineApp',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
      content: 'Setup was incredibly easy - we were tracking journeys within 10 minutes. The real-time analytics help us make quick decisions and test improvements instantly.',
      rating: 5
    },
    {
      name: 'Lisa Thompson',
      role: 'Marketing Director',
      company: 'EcoCommerce',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop&crop=face',
      content: 'The cross-device tracking capabilities are outstanding. We can finally see how customers interact with us across mobile, web, and email campaigns.',
      rating: 5
    },
    {
      name: 'James Wilson',
      role: 'CEO',
      company: 'StartupBoost',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=64&h=64&fit=crop&crop=face',
      content: 'As a startup, we needed affordable but powerful analytics. Journey Mapper delivers enterprise features at a fraction of the cost of other solutions.',
      rating: 5
    }
  ]

  const stats = [
    { value: '500+', label: 'Happy Customers' },
    { value: '2.5B+', label: 'Events Tracked' },
    { value: '30%', label: 'Avg. Conversion Increase' },
    { value: '99.9%', label: 'Uptime' }
  ]

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Trusted by teams at top companies
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how leading companies use Journey Mapper to optimize their customer experience 
            and drive meaningful business results.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Testimonial text */}
                <blockquote className="text-gray-700 mb-6 flex-grow">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Case study CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-center text-white">
          <h3 className="text-2xl lg:text-3xl font-bold mb-4">
            Want to see detailed results?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Read our in-depth case studies and learn exactly how companies like yours 
            achieved dramatic improvements in their conversion rates and customer experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Download Case Studies
            </button>
            <button className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>

        {/* Company logos */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-8">Trusted by innovative companies worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {[
              'TechFlow',
              'RetailPro',
              'FinanceFirst',
              'StreamlineApp',
              'EcoCommerce',
              'StartupBoost',
              'DataCorp',
              'CloudScale'
            ].map((company, index) => (
              <div key={index} className="bg-gray-100 px-6 py-3 rounded-lg text-sm font-medium text-gray-700">
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}