import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Redirect to first organization if user has one
  if (user.organizations && user.organizations.length > 0) {
    redirect(`/dashboard/${user.organizations[0].slug}`)
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to FeedbackFlow
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            You don't have access to any organizations yet. Create your first organization to get started.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
            Create Organization
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}