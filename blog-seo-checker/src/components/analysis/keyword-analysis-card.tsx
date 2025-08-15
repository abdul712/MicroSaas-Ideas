import { Search, Target, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KeywordAnalysis } from '@/services/seo-analyzer'

interface KeywordAnalysisCardProps {
  analysis: KeywordAnalysis
}

export function KeywordAnalysisCard({ analysis }: KeywordAnalysisCardProps) {
  // Get top keywords by density
  const topKeywords = Object.entries(analysis.keywordDensity)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)

  const getKeywordDensityColor = (density: number) => {
    if (density > 4) return 'text-red-600 bg-red-50'
    if (density > 2.5) return 'text-yellow-600 bg-yellow-50'
    if (density >= 0.5) return 'text-green-600 bg-green-50'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Keyword Analysis
        </CardTitle>
        <CardDescription>
          Keyword usage, density, and optimization opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Keywords */}
        <div className="space-y-3">
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">Primary Keywords</span>
          </div>
          
          {analysis.primaryKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.primaryKeywords.map((keyword, index) => (
                <Badge key={keyword} variant={index === 0 ? 'default' : 'secondary'}>
                  {keyword}
                  {analysis.keywordDensity[keyword] && (
                    <span className="ml-1 text-xs opacity-75">
                      {analysis.keywordDensity[keyword].toFixed(1)}%
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-700">
                No clear primary keywords detected. Consider focusing on specific target keywords.
              </div>
            </div>
          )}
        </div>

        {/* Keyword Density */}
        <div className="space-y-3">
          <div className="font-medium">Keyword Density</div>
          
          {topKeywords.length > 0 ? (
            <div className="space-y-2">
              {topKeywords.map(([keyword, density]) => (
                <div key={keyword} className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm font-medium">{keyword}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getKeywordDensityColor(density)}`}>
                    {density.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              No significant keywords found
            </div>
          )}
        </div>

        {/* Optimization Warnings */}
        {analysis.overOptimization && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
              <span className="text-sm font-medium text-red-800">Over-Optimization Detected</span>
            </div>
            <div className="text-sm text-red-700">
              Some keywords appear too frequently. This may hurt your SEO. Consider reducing keyword density to 2-4%.
            </div>
          </div>
        )}

        {analysis.keywordCannibalization && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Potential Keyword Cannibalization</span>
            </div>
            <div className="text-sm text-orange-700">
              Multiple pages may be competing for the same keywords. Review your content strategy.
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-3">
          <div className="font-medium">Recommendations</div>
          <div className="space-y-2 text-sm">
            {analysis.primaryKeywords.length === 0 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <span>Identify and focus on 1-3 primary target keywords</span>
              </div>
            )}
            
            {analysis.primaryKeywords.length > 0 && !analysis.keywordDensity[analysis.primaryKeywords[0]] && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <span>Include your primary keyword in the title and meta description</span>
              </div>
            )}
            
            {Object.values(analysis.keywordDensity).every(density => density < 0.5) && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <span>Increase keyword usage naturally throughout the content</span>
              </div>
            )}
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <span>Use related keywords and synonyms to improve semantic relevance</span>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <span>Include keywords in headings (H2, H3) for better structure</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}