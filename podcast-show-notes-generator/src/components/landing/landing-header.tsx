'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Menu, X, Mic2, UserCircle } from 'lucide-react'

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-podcast-600">
            <Mic2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">PodcastNotes AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="#features" 
            className="text-gray-600 hover:text-podcast-600 transition-colors"
          >
            Features
          </Link>
          <Link 
            href="#how-it-works" 
            className="text-gray-600 hover:text-podcast-600 transition-colors"
          >
            How it Works
          </Link>
          <Link 
            href="#pricing" 
            className="text-gray-600 hover:text-podcast-600 transition-colors"
          >
            Pricing
          </Link>
          <Link 
            href="#examples" 
            className="text-gray-600 hover:text-podcast-600 transition-colors"
          >
            Examples
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {status === 'loading' ? (
            <div className="h-8 w-20 animate-pulse bg-gray-200 rounded"></div>
          ) : session ? (
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => signIn()}
              >
                Sign In
              </Button>
              <Button 
                variant="podcast" 
                size="sm"
                onClick={() => signIn()}
              >
                Get Started Free
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link 
              href="#features" 
              className="block py-2 text-gray-600 hover:text-podcast-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#how-it-works" 
              className="block py-2 text-gray-600 hover:text-podcast-600"
              onClick={() => setIsMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link 
              href="#pricing" 
              className="block py-2 text-gray-600 hover:text-podcast-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="#examples" 
              className="block py-2 text-gray-600 hover:text-podcast-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Examples
            </Link>
            
            <div className="pt-4 border-t space-y-3">
              {session ? (
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      signIn()
                      setIsMenuOpen(false)
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="podcast" 
                    className="w-full"
                    onClick={() => {
                      signIn()
                      setIsMenuOpen(false)
                    }}
                  >
                    Get Started Free
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}