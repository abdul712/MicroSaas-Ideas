import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Content Creator',
    company: '@sarahcreates',
    image: '/testimonials/sarah.jpg',
    content: 'HashtagPro transformed my Instagram strategy. My engagement increased by 300% in just two months using their AI recommendations.',
    rating: 5
  },
  {
    name: 'Mike Chen',
    role: 'Marketing Manager',
    company: 'TechStart Inc.',
    image: '/testimonials/mike.jpg',
    content: 'The competitor analysis feature is incredible. We discovered hashtags our competitors were using that we never would have found.',
    rating: 5
  },
  {
    name: 'Emma Rodriguez',
    role: 'Social Media Manager',
    company: 'Fashion Brand Co.',
    image: '/testimonials/emma.jpg',
    content: 'Finally, a hashtag tool that actually works! The real-time trending data has helped us stay ahead of fashion trends.',
    rating: 5
  }
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by Content Creators
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join thousands of creators and businesses who've boosted their social media success with HashtagPro.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 bg-gray-50 dark:bg-gray-700">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}