import { render, screen } from '@testing-library/react'
import { PointsDisplay } from '../loyalty/points-display'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('PointsDisplay', () => {
  const mockProps = {
    totalPoints: 1500,
    availablePoints: 1200,
    tier: {
      name: 'Gold',
      color: '#FFD700'
    }
  }

  it('renders points information correctly', () => {
    render(<PointsDisplay {...mockProps} />)
    
    expect(screen.getByText('Your Points')).toBeInTheDocument()
    expect(screen.getByText('1.2K')).toBeInTheDocument() // availablePoints formatted
    expect(screen.getByText('Available Points')).toBeInTheDocument()
    expect(screen.getByText('Gold')).toBeInTheDocument()
  })

  it('displays total earned and redeemable points', () => {
    render(<PointsDisplay {...mockProps} />)
    
    expect(screen.getByText('Total Earned')).toBeInTheDocument()
    expect(screen.getByText('Redeemable')).toBeInTheDocument()
    expect(screen.getByText('1.5K')).toBeInTheDocument() // totalPoints formatted
  })

  it('applies tier styling', () => {
    render(<PointsDisplay {...mockProps} />)
    
    const tierBadge = screen.getByText('Gold')
    expect(tierBadge).toHaveStyle({ backgroundColor: '#FFD700' })
  })

  it('handles animation prop', () => {
    render(<PointsDisplay {...mockProps} isAnimating={true} />)
    
    // The component should render without errors when animating
    expect(screen.getByText('Your Points')).toBeInTheDocument()
  })
})