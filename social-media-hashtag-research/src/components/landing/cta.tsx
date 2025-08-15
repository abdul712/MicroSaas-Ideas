import { Button } from '@/components/ui/button'
import { Zap, ArrowRight } from 'lucide-react'
import { signIn } from 'next-auth/react'

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to Boost Your Social Media Reach?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of content creators and businesses using HashtagPro to grow their social media presence.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-3"
            onClick={() => signIn()}
          >
            <Zap className="w-5 h-5 mr-2" />
            Start Free Trial
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-purple-700"
          >
            View Demo
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
        
        <p className="text-blue-200 mt-6 text-sm">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </div>
    </section>
  )
}