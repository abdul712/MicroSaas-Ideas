import { SignInForm } from '@/components/auth/signin-form'
import { Suspense } from 'react'

interface SignInPageProps {
  searchParams: {
    callbackUrl?: string
    error?: string
  }
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm callbackUrl={searchParams.callbackUrl} />
          {searchParams.error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {searchParams.error === 'Configuration' && 'There is a problem with the server configuration.'}
              {searchParams.error === 'AccessDenied' && 'Access denied. You do not have permission to sign in.'}
              {searchParams.error === 'Verification' && 'The verification token has expired or has already been used.'}
              {!['Configuration', 'AccessDenied', 'Verification'].includes(searchParams.error) && 
                'An error occurred during sign in. Please try again.'
              }
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )
}