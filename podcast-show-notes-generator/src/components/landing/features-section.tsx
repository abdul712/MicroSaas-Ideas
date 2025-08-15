'use client'

import { 
  Mic2, 
  FileText, 
  Zap, 
  Globe, 
  Users, 
  BarChart3,
  Clock,
  Search,
  Share2,
  Download,
  Settings,
  Shield
} from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      icon: Mic2,
      title: 'AI-Powered Transcription',
      description: 'Industry-leading 95%+ accuracy with speaker identification and smart timestamps using OpenAI Whisper and AssemblyAI.',
      highlights: ['Speaker diarization', 'Auto punctuation', '30+ languages']
    },
    {
      icon: FileText,
      title: 'Smart Show Notes',
      description: 'Generate comprehensive show notes with summaries, key points, quotes, and resource links tailored to your podcast style.',
      highlights: ['Episode summaries', 'Key takeaways', 'Notable quotes']
    },
    {
      icon: Search,
      title: 'SEO Optimization',
      description: 'Built-in SEO tools create searchable content with keywords, meta descriptions, and structured data for better discoverability.',
      highlights: ['Keyword research', 'Meta optimization', 'Schema markup']
    },
    {
      icon: Share2,
      title: 'Social Media Ready',
      description: 'Auto-generate platform-specific content for Twitter, LinkedIn, Instagram, and Facebook to amplify your podcast reach.',
      highlights: ['Twitter threads', 'LinkedIn posts', 'Instagram captions']
    },
    {
      icon: Download,
      title: 'Multiple Export Formats',
      description: 'Export your show notes as Markdown, HTML, PDF, or directly publish to your website and podcast platforms.',
      highlights: ['Markdown/HTML', 'PDF export', 'Direct publishing']
    },
    {
      icon: Settings,
      title: 'Custom Templates',
      description: 'Choose from industry-specific templates or create your own to match your podcast brand and style preferences.',
      highlights: ['Interview templates', 'Solo show formats', 'Custom branding']
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Invite team members to review, edit, and approve show notes with built-in commenting and workflow management.',
      highlights: ['Multi-user access', 'Review workflows', 'Version control']
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track performance metrics, processing times, and content engagement across all your podcast episodes.',
      highlights: ['Performance tracking', 'Usage analytics', 'Content insights']
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process 60-minute episodes in under 3 minutes with our optimized AI pipeline and cloud infrastructure.',
      highlights: ['Sub-3min processing', 'Real-time updates', 'Priority queue']
    },
    {
      icon: Globe,
      title: 'Platform Integrations',
      description: 'Connect with major podcast hosting platforms, CMS, and social media tools for seamless content distribution.',
      highlights: ['Spotify integration', 'WordPress sync', 'Buffer/Hootsuite']
    },
    {
      icon: Clock,
      title: 'Automated Workflows',
      description: 'Set up RSS monitoring to automatically process new episodes and publish show notes without manual intervention.',
      highlights: ['RSS monitoring', 'Auto-processing', 'Scheduled publishing']
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'SOC 2 compliant with end-to-end encryption, secure file handling, and GDPR compliance for your audio content.',
      highlights: ['End-to-end encryption', 'GDPR compliant', 'Secure storage']
    }
  ]

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Everything you need to create{' '}
            <span className="text-podcast-600">professional show notes</span>
          </h2>
          <p className="text-lg text-gray-600">
            From transcription to SEO optimization, our comprehensive suite of tools 
            handles every aspect of show notes creation so you can focus on creating great content.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-podcast-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-podcast-100 group-hover:bg-podcast-600 rounded-lg flex items-center justify-center transition-colors duration-300">
                    <feature.icon className="w-6 h-6 text-podcast-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-podcast-900 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Feature highlights */}
                  <ul className="space-y-1">
                    {feature.highlights.map((highlight, highlightIndex) => (
                      <li key={highlightIndex} className="flex items-center text-xs text-podcast-700">
                        <div className="w-1 h-1 bg-podcast-600 rounded-full mr-2"></div>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Ready to see these features in action?
          </p>
          <button className="inline-flex items-center px-6 py-3 bg-podcast-600 text-white rounded-lg hover:bg-podcast-700 transition-colors duration-200">
            <Zap className="w-4 h-4 mr-2" />
            Start Your Free Trial
          </button>
        </div>
      </div>
    </section>
  )
}