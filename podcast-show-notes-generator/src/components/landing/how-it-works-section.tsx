'use client'

import { Upload, Cpu, FileText, Share2, CheckCircle } from 'lucide-react'

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      icon: Upload,
      title: 'Upload Your Audio',
      description: 'Drag and drop your podcast audio file or paste a URL. We support MP3, WAV, M4A, and more formats up to 500MB.',
      details: [
        'Multiple audio formats supported',
        'Large file handling up to 500MB',
        'URL import from hosting platforms',
        'Secure encrypted upload'
      ]
    },
    {
      number: '02',
      icon: Cpu,
      title: 'AI Processing Magic',
      description: 'Our advanced AI pipeline transcribes your audio with 95%+ accuracy and identifies speakers, topics, and key moments.',
      details: [
        'OpenAI Whisper + AssemblyAI transcription',
        'Speaker diarization and identification',
        'Topic modeling and segmentation',
        'Real-time processing updates'
      ]
    },
    {
      number: '03',
      icon: FileText,
      title: 'Generate Show Notes',
      description: 'AI creates comprehensive show notes with summaries, timestamps, quotes, and SEO-optimized content tailored to your style.',
      details: [
        'Intelligent episode summaries',
        'Timestamped key moments',
        'Notable quotes and insights',
        'SEO keyword optimization'
      ]
    },
    {
      number: '04',
      icon: Share2,
      title: 'Export & Publish',
      description: 'Review, edit, and export your show notes in multiple formats or publish directly to your website and social platforms.',
      details: [
        'Multiple export formats available',
        'Direct platform integrations',
        'Social media content generation',
        'One-click publishing workflows'
      ]
    }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-podcast-50/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            From Audio to Show Notes in{' '}
            <span className="text-podcast-600">4 Simple Steps</span>
          </h2>
          <p className="text-lg text-gray-600">
            Our streamlined process transforms hours of manual work into minutes of automated magic. 
            Here's how it works:
          </p>
        </div>

        {/* Process timeline */}
        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute left-16 top-24 w-0.5 h-32 bg-gradient-to-b from-podcast-200 to-podcast-300"></div>
              )}
              
              <div className={`flex flex-col lg:flex-row items-center gap-8 mb-16 ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}>
                {/* Step icon and number */}
                <div className="flex-shrink-0 relative">
                  <div className="w-32 h-32 bg-white rounded-2xl shadow-lg border border-podcast-100 flex flex-col items-center justify-center relative overflow-hidden group">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-podcast-50 to-podcast-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Step number */}
                    <div className="absolute top-2 right-2 text-xs font-bold text-podcast-400 group-hover:text-podcast-600 transition-colors duration-300">
                      {step.number}
                    </div>
                    
                    {/* Icon */}
                    <step.icon className="w-12 h-12 text-podcast-600 group-hover:text-podcast-700 transition-colors duration-300 relative z-10" />
                  </div>
                </div>

                {/* Step content */}
                <div className={`flex-1 ${index % 2 === 1 ? 'lg:text-right' : ''}`}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Step details */}
                  <div className={`grid sm:grid-cols-2 gap-3 ${
                    index % 2 === 1 ? 'lg:justify-end' : ''
                  }`}>
                    {step.details.map((detail, detailIndex) => (
                      <div 
                        key={detailIndex}
                        className={`flex items-center space-x-3 ${
                          index % 2 === 1 ? 'lg:flex-row-reverse lg:space-x-reverse' : ''
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 text-podcast-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Processing time highlight */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-podcast-100 max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-podcast-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-podcast-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">
                <span className="text-podcast-600">3 minutes</span> for 60min episode
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            What used to take 3+ hours of manual work now happens automatically in minutes
          </p>
        </div>
      </div>
    </section>
  )
}