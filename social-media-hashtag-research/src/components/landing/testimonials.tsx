'use client';

import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Star, Quote, TrendingUp, Users, Zap } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Social Media Manager',
    company: 'TechStart Inc.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'HashtagIQ completely transformed our social media strategy. We went from struggling to get 100 likes to consistently hitting 10K+ on every post. The AI recommendations are incredibly accurate!',
    metrics: {
      engagement: '+340%',
      reach: '+250%',
      time_saved: '15 hrs/week',
    },
    rating: 5,
    platform: 'Instagram',
    verified: true,
  },
  {
    id: 2,
    name: 'Mike Rodriguez',
    role: 'Travel Content Creator',
    company: '@miketravel (450K followers)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    content: 'As a full-time content creator, finding the right hashtags was eating up hours of my day. HashtagIQ gives me perfect suggestions in seconds. My engagement rates have never been higher!',
    metrics: {
      engagement: '+280%',
      reach: '+180%',
      time_saved: '20 hrs/week',
    },
    rating: 5,
    platform: 'Instagram + TikTok',
    verified: true,
  },
  {
    id: 3,
    name: 'Emily Watson',
    role: 'Digital Marketing Director',
    company: 'FashionForward Co.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    content: 'Managing hashtag strategies for 12 different brands was a nightmare until we found HashtagIQ. The competitor analysis feature alone has saved us thousands in consulting fees.',
    metrics: {
      engagement: '+195%',
      reach: '+320%',
      time_saved: '25 hrs/week',
    },
    rating: 5,
    platform: 'Multi-platform',
    verified: true,
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Fitness Influencer',
    company: '@fitwithdavid (280K followers)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    content: 'The trend prediction feature is amazing! I was using #homeworkout before it exploded during lockdown. HashtagIQ helped me stay ahead of fitness trends consistently.',
    metrics: {
      engagement: '+420%',
      reach: '+290%',
      time_saved: '12 hrs/week',
    },
    rating: 5,
    platform: 'Instagram + YouTube',
    verified: true,
  },
  {
    id: 5,
    name: 'Lisa Park',
    role: 'Food Blogger',
    company: 'Tasty Adventures Blog',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    content: 'I was skeptical about another social media tool, but HashtagIQ proved me wrong. The difficulty scoring helps me find hashtags that actually work instead of getting lost in oversaturated tags.',
    metrics: {
      engagement: '+165%',
      reach: '+210%',
      time_saved: '8 hrs/week',
    },
    rating: 5,
    platform: 'Instagram + Pinterest',
    verified: true,
  },
  {
    id: 6,
    name: 'Carlos Mendez',
    role: 'Social Media Agency Owner',
    company: 'Mendez Digital',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    content: 'Our agency now serves 30+ clients efficiently thanks to HashtagIQ. The white-label reports look professional, and clients love seeing their hashtag performance data.',
    metrics: {
      engagement: '+245%',
      reach: '+310%',
      time_saved: '40 hrs/week',
    },
    rating: 5,
    platform: 'Enterprise',
    verified: true,
  },
];

const stats = [
  {
    icon: TrendingUp,
    value: '2.5M+',
    label: 'Hashtags Analyzed Daily',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    value: '50K+',
    label: 'Active Content Creators',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    value: '340%',
    label: 'Average Engagement Boost',
    color: 'from-green-500 to-emerald-500',
  },
];

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="px-4 py-2">
            <Star className="mr-2 h-4 w-4" />
            Success Stories
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            See What Our Users
            <span className="gradient-text"> Are Achieving</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Join thousands of content creators, influencers, and businesses who've 
            transformed their social media presence with HashtagIQ.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 glass-card rounded-xl">
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${stat.color} mb-4`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold mb-2">{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="p-6 glass-card rounded-xl hover:shadow-lg transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <Quote className="h-8 w-8 text-blue-500/20" />
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {testimonial.metrics.engagement}
                  </div>
                  <div className="text-xs text-muted-foreground">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {testimonial.metrics.reach}
                  </div>
                  <div className="text-xs text-muted-foreground">Reach</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {testimonial.metrics.time_saved}
                  </div>
                  <div className="text-xs text-muted-foreground">Time Saved</div>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="object-cover"
                  />
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="font-semibold">{testimonial.name}</div>
                    {testimonial.verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.company} • {testimonial.platform}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center space-y-6">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Ready to Join Them?</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start your free trial today and see how HashtagIQ can transform 
              your social media performance in just 7 days.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="text-sm text-muted-foreground">
              ⭐ 4.9/5 from 2,500+ reviews
            </div>
            <div className="text-sm text-muted-foreground">
              🚀 50,000+ active users
            </div>
            <div className="text-sm text-muted-foreground">
              ⚡ 14-day free trial
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}