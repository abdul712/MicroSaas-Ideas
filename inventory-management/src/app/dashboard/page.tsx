import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InventoryOverview } from '@/components/dashboard/inventory-overview'
import { LowStockAlerts } from '@/components/dashboard/low-stock-alerts'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time overview of your inventory and operations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <InventoryOverview />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest inventory movements and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RecentActivity />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>
              Products that need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LowStockAlerts />
          </CardContent>
        </Card>
      </div>

      <QuickActions />
    </div>
  )
}