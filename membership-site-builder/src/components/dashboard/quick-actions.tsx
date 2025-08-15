import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Users, Settings, CreditCard } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      title: 'Create Site',
      description: 'Start a new membership site',
      icon: Plus,
      href: '/dashboard/sites/new',
      color: 'text-blue-600'
    },
    {
      title: 'Add Content',
      description: 'Create protected content',
      icon: FileText,
      href: '/dashboard/content/new',
      color: 'text-green-600'
    },
    {
      title: 'Manage Members',
      description: 'View and manage members',
      icon: Users,
      href: '/dashboard/members',
      color: 'text-purple-600'
    },
    {
      title: 'Payment Settings',
      description: 'Configure billing',
      icon: CreditCard,
      href: '/dashboard/settings/payments',
      color: 'text-orange-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.title}
                variant="ghost"
                className="w-full justify-start h-auto p-4"
                asChild
              >
                <Link href={action.href}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${action.color}`} />
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}