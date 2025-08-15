import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { AnalysisResults } from '@/components/analysis/analysis-results'
import { AnalysisLoading } from '@/components/analysis/analysis-loading'

interface AnalysisPageProps {
  params: {
    id: string
  }
}

export default function AnalysisPage({ params }: AnalysisPageProps) {
  const { id } = params

  if (!id || typeof id !== 'string') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<AnalysisLoading />}>
        <AnalysisResults analysisId={id} />
      </Suspense>
    </div>
  )
}

export async function generateMetadata({ params }: AnalysisPageProps) {
  const { id } = params
  
  return {
    title: `SEO Analysis Results - ${id}`,
    description: 'Comprehensive SEO analysis results with actionable recommendations to improve your website\'s search engine optimization.',
    robots: {
      index: false, // Don't index analysis results
      follow: false,
    },
  }
}