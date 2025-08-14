import { Search } from 'lucide-react'

export function AnalysisLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <div className="animate-pulse-glow mb-4">
          <Search className="h-16 w-16 text-primary mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Analysis Results</h1>
        <p className="text-gray-600 mb-8">
          Please wait while we load your SEO analysis...
        </p>
        
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-6"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="lg:col-span-3 h-64 bg-gray-200 rounded"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}