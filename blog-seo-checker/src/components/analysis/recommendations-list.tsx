import { useState } from 'react'
import { ChevronDown, ChevronUp, Target, Zap, AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SeoRecommendation } from '@/services/seo-analyzer'

interface RecommendationsListProps {
  recommendations: SeoRecommendation[]
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Zap className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>
      case 'medium':
        return <Badge variant="warning">Medium Priority</Badge>
      case 'low':
        return <Badge variant="info">Low Priority</Badge>
      default:
        return <Badge variant="secondary">Priority</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const categoryMap = {
      technical: { variant: 'secondary' as const, label: 'Technical' },
      content: { variant: 'info' as const, label: 'Content' },
      keywords: { variant: 'warning' as const, label: 'Keywords' },
      performance: { variant: 'destructive' as const, label: 'Performance' },
      meta: { variant: 'default' as const, label: 'Meta Tags' },
    }
    
    const config = categoryMap[category as keyof typeof categoryMap] || { variant: 'secondary' as const, label: category }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Sort recommendations by priority and impact
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority // Higher priority first
    }
    
    return b.impact - a.impact // Higher impact first
  })

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations</h3>
        <p className="text-gray-500">
          Your SEO is looking great! No immediate action items were found.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedRecommendations.map((recommendation) => {
        const isExpanded = expandedItems.has(recommendation.id)
        
        return (
          <div
            key={recommendation.id}
            className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  {getPriorityIcon(recommendation.priority)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {recommendation.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {recommendation.description}
                    </p>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      {getPriorityBadge(recommendation.priority)}
                      {getCategoryBadge(recommendation.category)}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(recommendation.id)}
                  className="ml-2"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Impact and Effort Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Impact</span>
                    <span className="font-medium">{recommendation.impact}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${recommendation.impact}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Effort</span>
                    <span className="font-medium">{recommendation.effort}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${recommendation.effort}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">How to Fix</h5>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {recommendation.howToFix}
                    </p>
                  </div>

                  {recommendation.examples && recommendation.examples.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Examples</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {recommendation.examples.map((example, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}