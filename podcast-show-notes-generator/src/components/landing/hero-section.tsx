'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { Play, Clock, Zap, Target, CheckCircle, Upload } from 'lucide-react'

export function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  const handleGetStarted = () => {
    signIn()
  }

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-podcast-50 to-blue-50"></div>
      
      {/* Hero content */}
      <div className="relative container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-podcast-100 text-podcast-800 text-sm font-medium mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Generate show notes in under 3 minutes
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your{' '}
            <span className="text-podcast-600">Podcast Audio</span>{' '}
            Into SEO-Ready Show Notes
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Stop spending hours on show notes. Our AI creates comprehensive, engaging content 
            with timestamps, quotes, and social media posts in minutes.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mb-10 text-sm">
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2 text-podcast-600" />
              Save 3+ hours per episode
            </div>
            <div className="flex items-center text-gray-600">
              <Target className="w-4 h-4 mr-2 text-podcast-600" />
              95%+ transcription accuracy
            </div>
            <div className="flex items-center text-gray-600">
              <CheckCircle className="w-4 h-4 mr-2 text-podcast-600" />
              SEO optimized content
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="xl" 
              variant="podcast" 
              onClick={handleGetStarted}
              className="min-w-48"
            >
              <Upload className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button 
              size="xl" 
              variant="outline" 
              onClick={() => setIsPlaying(!isPlaying)}
              className="min-w-48"
            >
              <Play className={`w-5 h-5 mr-2 ${isPlaying ? 'animate-pulse' : ''}`} />
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <p className="text-sm text-gray-500 mb-8">
            Join 2,500+ podcasters who save time with PodcastNotes AI
          </p>
        </div>

        {/* Demo video/preview */}
        <div className="max-w-5xl mx-auto mt-12">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white p-4">
            <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center relative">
              {!isPlaying ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-podcast-600 rounded-full flex items-center justify-center mb-4 mx-auto cursor-pointer hover:bg-podcast-700 transition-colors"
                       onClick={() => setIsPlaying(true)}>
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    See how PodcastNotes AI transforms 60 minutes of audio into professional show notes
                  </p>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-podcast-600 to-podcast-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Demo video would play here</p>
                    <button 
                      onClick={() => setIsPlaying(false)}
                      className="mt-2 text-sm underline hover:no-underline"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-podcast-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-podcast-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Upload & Process</h3>
            <p className="text-gray-600 text-sm">
              Drag and drop your audio file. We handle MP3, WAV, M4A, and more.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-podcast-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-podcast-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Magic</h3>
            <p className="text-gray-600 text-sm">
              Our AI transcribes, summarizes, and creates engaging show notes automatically.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-podcast-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-podcast-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Publish Everywhere</h3>
            <p className="text-gray-600 text-sm">
              Export to your website, social media, or podcast platform with one click.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}