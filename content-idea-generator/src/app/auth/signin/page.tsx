'use client'

import { useState } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Github, Mail, Chrome, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await signIn('email', {
        email,
        redirect: false,
      })
      
      if (result?.ok) {
        router.push('/auth/verify-request')
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold gradient-text">
              <Lightbulb className="h-8 w-8" />
              Content Idea Generator
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your account to continue generating amazing content ideas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Social Sign In Buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleProviderSignIn('google')}
                  disabled={isLoading}
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  Continue with Google
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleProviderSignIn('github')}
                  disabled={isLoading}
                >
                  <Github className="w-4 h-4 mr-2" />
                  Continue with GitHub
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Email Sign In Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading || !email}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending magic link...
                    </div>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send magic link
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <span className="font-medium">
                  Sign in with any method above to create one automatically
                </span>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-foreground">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}