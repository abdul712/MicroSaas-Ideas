import { Metadata } from 'next'
import { CustomerPortalHeader } from '@/components/portal/header'
import { CustomerPortalSidebar } from '@/components/portal/sidebar'

export const metadata: Metadata = {
  title: 'Customer Portal - Support System',
  description: 'Customer self-service portal for support tickets and knowledge base',
}

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <CustomerPortalHeader />
      <div className="flex">
        <CustomerPortalSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}