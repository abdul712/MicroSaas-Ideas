import { AlertTriangle, AlertCircle, Info, Wrench } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TechnicalIssue } from '@/services/seo-analyzer'

interface TechnicalIssuesListProps {
  issues: TechnicalIssue[]
}

export function TechnicalIssuesList({ issues }: TechnicalIssuesListProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="critical">Critical</Badge>
      case 'warning':
        return <Badge variant="warning">Warning</Badge>
      case 'info':
        return <Badge variant="info">Info</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  // Group issues by severity for better organization
  const groupedIssues = issues.reduce((acc, issue) => {
    const severity = issue.severity
    if (!acc[severity]) {
      acc[severity] = []
    }
    acc[severity].push(issue)
    return acc
  }, {} as Record<string, TechnicalIssue[]>)

  const severityOrder = ['critical', 'warning', 'info']

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-green-600" />
            Technical Issues
          </CardTitle>
          <CardDescription>
            Technical SEO problems that need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Wrench className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No Technical Issues Found</h3>
            <p className="text-sm text-gray-500">
              Your website's technical SEO is in good shape!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wrench className="h-5 w-5 mr-2" />
          Technical Issues
          <Badge variant="secondary" className="ml-2">
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          Technical SEO problems that need attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {severityOrder.map((severity) => {
            const severityIssues = groupedIssues[severity]
            if (!severityIssues || severityIssues.length === 0) return null

            return (
              <div key={severity} className="space-y-3">
                <div className="flex items-center space-x-2">
                  {getSeverityIcon(severity)}
                  <span className="font-medium capitalize">{severity} Issues</span>
                  <Badge variant="secondary">{severityIssues.length}</Badge>
                </div>

                <div className="space-y-2">
                  {severityIssues.map((issue, index) => (
                    <div
                      key={`${severity}-${index}`}
                      className={`p-4 rounded-lg border ${getSeverityColor(severity)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getSeverityIcon(issue.severity)}
                            <h4 className="font-medium text-gray-900">
                              {issue.message}
                            </h4>
                            {getSeverityBadge(issue.severity)}
                          </div>
                          
                          {issue.element && (
                            <div className="text-xs text-gray-600 mb-2">
                              <span className="font-medium">Element:</span> {issue.element}
                            </div>
                          )}
                          
                          {issue.location && (
                            <div className="text-xs text-gray-600 mb-2">
                              <span className="font-medium">Location:</span> {issue.location}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-white rounded border">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Suggestion:</span>
                          <p className="text-gray-600 mt-1">{issue.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {groupedIssues.critical?.length || 0}
              </div>
              <div className="text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">
                {groupedIssues.warning?.length || 0}
              </div>
              <div className="text-gray-600">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {groupedIssues.info?.length || 0}
              </div>
              <div className="text-gray-600">Info</div>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-gray-600">
            <p>
              <strong>Priority:</strong> Fix critical issues first, then warnings, then informational items.
              Critical issues can significantly impact your SEO performance.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}