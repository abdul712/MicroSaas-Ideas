import { FileText, Hash, Image, Link } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ContentAnalysis } from '@/services/seo-analyzer'
import { formatNumber } from '@/lib/utils'

interface ContentAnalysisCardProps {
  analysis: ContentAnalysis
}

export function ContentAnalysisCard({ analysis }: ContentAnalysisCardProps) {
  const getReadabilityBadge = (score: number) => {
    if (score >= 80) return { variant: 'excellent' as const, label: 'Excellent' }
    if (score >= 60) return { variant: 'good' as const, label: 'Good' }
    if (score >= 40) return { variant: 'fair' as const, label: 'Fair' }
    return { variant: 'poor' as const, label: 'Poor' }
  }

  const readabilityBadge = getReadabilityBadge(analysis.readabilityScore)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Content Analysis
        </CardTitle>
        <CardDescription>
          Content quality, structure, and readability metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{formatNumber(analysis.wordCount)}</div>
            <div className="text-sm text-gray-600">Words</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{analysis.readabilityScore}</div>
            <div className="text-sm text-gray-600">Readability</div>
          </div>
        </div>

        {/* Readability Assessment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Readability Score</span>
            <Badge variant={readabilityBadge.variant}>
              {readabilityBadge.label}
            </Badge>
          </div>
          <div className="text-sm text-gray-600">
            {analysis.readabilityScore >= 80 && "Your content is very easy to read and understand."}
            {analysis.readabilityScore >= 60 && analysis.readabilityScore < 80 && "Your content is fairly easy to read."}
            {analysis.readabilityScore >= 40 && analysis.readabilityScore < 60 && "Your content may be difficult for some readers."}
            {analysis.readabilityScore < 40 && "Your content is difficult to read. Consider simplifying."}
          </div>
        </div>

        {/* Heading Structure */}
        <div className="space-y-3">
          <div className="flex items-center">
            <Hash className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">Heading Structure</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center p-2 border rounded">
              <div className="font-semibold">{analysis.headingStructure.h1Count}</div>
              <div className="text-gray-500">H1</div>
            </div>
            <div className="text-center p-2 border rounded">
              <div className="font-semibold">{analysis.headingStructure.h2Count}</div>
              <div className="text-gray-500">H2</div>
            </div>
            <div className="text-center p-2 border rounded">
              <div className="font-semibold">{analysis.headingStructure.h3Count}</div>
              <div className="text-gray-500">H3</div>
            </div>
          </div>

          {analysis.headingStructure.missingHeadings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm font-medium text-yellow-800 mb-1">Missing Headings</div>
              <div className="text-sm text-yellow-700">
                Consider adding {analysis.headingStructure.missingHeadings.join(', ')} tags to improve content structure.
              </div>
            </div>
          )}
        </div>

        {/* Image Analysis */}
        <div className="space-y-3">
          <div className="flex items-center">
            <Image className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">Images</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 border rounded">
              <span>Total Images</span>
              <span className="font-semibold">{analysis.imageAnalysis.totalImages}</span>
            </div>
            <div className="flex justify-between p-2 border rounded">
              <span>Missing Alt Text</span>
              <span className={`font-semibold ${
                analysis.imageAnalysis.imagesWithoutAlt > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {analysis.imageAnalysis.imagesWithoutAlt}
              </span>
            </div>
          </div>

          {analysis.imageAnalysis.imagesWithoutAlt > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm font-medium text-red-800 mb-1">Alt Text Missing</div>
              <div className="text-sm text-red-700">
                {analysis.imageAnalysis.imagesWithoutAlt} images are missing alt text. 
                Add descriptive alt text for better accessibility and SEO.
              </div>
            </div>
          )}
        </div>

        {/* Links Analysis */}
        <div className="space-y-3">
          <div className="flex items-center">
            <Link className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">Links</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 border rounded">
              <span>Internal Links</span>
              <span className="font-semibold">{analysis.internalLinks}</span>
            </div>
            <div className="flex justify-between p-2 border rounded">
              <span>External Links</span>
              <span className="font-semibold">{analysis.externalLinks}</span>
            </div>
          </div>
        </div>

        {/* Text to HTML Ratio */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Text to HTML Ratio</span>
            <span className={`font-semibold ${
              analysis.textToHtmlRatio >= 15 ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {analysis.textToHtmlRatio.toFixed(1)}%
            </span>
          </div>
          
          {analysis.textToHtmlRatio < 15 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-700">
                Low text-to-HTML ratio. Consider adding more meaningful content relative to your HTML code.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}