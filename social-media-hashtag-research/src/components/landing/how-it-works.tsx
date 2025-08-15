import { Card, CardContent } from '@/components/ui/card'
import { Search, BarChart3, Target, Zap } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Search & Discover',
    description: 'Enter your topic or niche and let our AI find the most relevant and effective hashtags for your content.',
    step: '01'
  },
  {
    icon: BarChart3,
    title: 'Analyze Performance',
    description: 'Review detailed analytics including post counts, engagement rates, difficulty scores, and trending data.',
    step: '02'
  },
  {
    icon: Target,
    title: 'Optimize Strategy',
    description: 'Get personalized recommendations and create hashtag sets tailored to your audience and goals.',
    step: '03'
  },
  {
    icon: Zap,
    title: 'Boost Engagement',
    description: 'Use data-driven hashtags to increase your reach, engagement, and grow your social media presence.',
    step: '04'
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get started in minutes with our simple 4-step process to hashtag success.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <Card key={index} className="text-center border-0 bg-gray-50 dark:bg-gray-700">
                <CardContent className="p-8">
                  <div className="relative">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}