import { render, screen } from '@testing-library/react'
import { HealthScoreCard } from '@/components/dashboard/health-score-card'

const mockHealthScore = {
  overall: 78,
  financial: 82,
  customer: 75,
  operations: 80,
  growth: 71,
  marketing: 76
}

// Mock the tooltip components
jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('HealthScoreCard', () => {
  it('renders health score card with correct overall score', () => {
    render(<HealthScoreCard healthScore={mockHealthScore} />)
    
    expect(screen.getByText('Business Health Score')).toBeInTheDocument()
    expect(screen.getByText('78')).toBeInTheDocument()
    expect(screen.getByText('Score')).toBeInTheDocument()
  })

  it('displays correct health score label', () => {
    render(<HealthScoreCard healthScore={mockHealthScore} />)
    
    // Score of 78 should be "Good"
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('renders all category scores', () => {
    render(<HealthScoreCard healthScore={mockHealthScore} />)
    
    expect(screen.getByText('Financial Health')).toBeInTheDocument()
    expect(screen.getByText('Customer Health')).toBeInTheDocument()
    expect(screen.getByText('Operations')).toBeInTheDocument()
    expect(screen.getByText('Growth')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
    
    expect(screen.getByText('82')).toBeInTheDocument() // Financial
    expect(screen.getByText('75')).toBeInTheDocument() // Customer
    expect(screen.getByText('80')).toBeInTheDocument() // Operations
    expect(screen.getByText('71')).toBeInTheDocument() // Growth
    expect(screen.getByText('76')).toBeInTheDocument() // Marketing
  })

  it('displays recommendations section', () => {
    render(<HealthScoreCard healthScore={mockHealthScore} />)
    
    expect(screen.getByText('Recommendations')).toBeInTheDocument()
    expect(screen.getByText(/Based on your current health score/)).toBeInTheDocument()
  })

  it('renders with critical score styling', () => {
    const criticalScore = {
      ...mockHealthScore,
      overall: 35,
      customer: 30
    }
    
    render(<HealthScoreCard healthScore={criticalScore} />)
    
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
  })

  it('renders with excellent score styling', () => {
    const excellentScore = {
      ...mockHealthScore,
      overall: 95
    }
    
    render(<HealthScoreCard healthScore={excellentScore} />)
    
    expect(screen.getByText('Excellent')).toBeInTheDocument()
    expect(screen.getByText('95')).toBeInTheDocument()
  })
})