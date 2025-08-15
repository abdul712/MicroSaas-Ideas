import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Site {
  id: string
  name: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'SUSPENDED'
  _count: {
    memberships: number
    content: number
  }
}

interface DashboardOverviewProps {
  sites: Site[]
}

export function DashboardOverview({ sites }: DashboardOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Sites</CardTitle>
        <CardDescription>
          Manage your membership sites and track their performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sites created yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first membership site to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard/sites/new">
                Create Your First Site
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sites.map((site) => (
              <div key={site.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{site.name}</h3>
                    <p className="text-sm text-muted-foreground">/{site.slug}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant={site.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {site.status.toLowerCase()}
                  </Badge>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{site._count.memberships}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{site._count.content}</span>
                  </div>
                  
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/sites/${site.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/sites/new">
                Create New Site
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}