import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/landing-page'
import { DashboardRedirect } from '@/components/dashboard/dashboard-redirect'

export default async function HomePage() {
  const session = await auth()

  if (session?.user) {
    return <DashboardRedirect />
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LandingPage />
    </Suspense>
  )
}