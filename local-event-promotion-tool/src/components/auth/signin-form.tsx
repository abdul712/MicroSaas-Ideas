'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Chrome, Facebook, Github, Mail } from 'lucide-react'

interface SignInFormProps {
  callbackUrl?: string
}

export function SignInForm({ callbackUrl = '/dashboard' }: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        toast({
          title: 'Error',
          description: 'Failed to send sign-in email. Please try again.',
          variant: 'destructive',
        })
      } else {
        setIsEmailSent(true)
        toast({
          title: 'Check your email',
          description: 'A sign-in link has been sent to your email address.',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Error',
          description: `Failed to sign in with ${provider}. Please try again.`,
          variant: 'destructive',
        })
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a sign-in link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsEmailSent(false)}
          >
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Welcome to EventPro</CardTitle>
        <CardDescription>
          Sign in to your account to start promoting events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Social Sign In */}
        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="outline"
            onClick={() => handleSocialSignIn('google')}
            disabled={isLoading}
            className="w-full"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialSignIn('facebook')}
            disabled={isLoading}
            className="w-full facebook-brand text-white border-blue-600"
          >
            <Facebook className="mr-2 h-4 w-4" />
            Continue with Facebook
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialSignIn('github')}
            disabled={isLoading}
            className="w-full"
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Sign In */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !email}>
            {isLoading ? 'Sending...' : 'Send sign-in link'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          By signing in, you agree to our{' '}
          <a href="/terms" className="underline hover:text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </a>
        </div>
      </CardContent>
    </Card>
  )
}