import { render, screen } from '@testing-library/react'
import { DashboardOverview } from '../overview'

// Mock the icons to avoid rendering issues in tests
jest.mock('lucide-react', () => ({
  Ticket: () => <div data-testid="ticket-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Users: () => <div data-testid="users-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Target: () => <div data-testid="target-icon" />,
}))

describe('DashboardOverview', () => {
  it('renders all stat cards', () => {
    render(<DashboardOverview />)
    
    // Check for key statistics
    expect(screen.getByText('Total Tickets')).toBeInTheDocument()
    expect(screen.getByText('2,847')).toBeInTheDocument()
    
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
    expect(screen.getByText('2.4h')).toBeInTheDocument()
    
    expect(screen.getByText('Resolution Rate')).toBeInTheDocument()
    expect(screen.getByText('94.2%')).toBeInTheDocument()
    
    expect(screen.getByText('Customer Satisfaction')).toBeInTheDocument()
    expect(screen.getByText('4.8/5')).toBeInTheDocument()
  })

  it('displays change indicators', () => {
    render(<DashboardOverview />)
    
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
    expect(screen.getByText('-23.1%')).toBeInTheDocument()
    expect(screen.getByText('+2.1%')).toBeInTheDocument()
  })

  it('shows descriptions for each stat', () => {
    render(<DashboardOverview />)
    
    expect(screen.getByText('This month')).toBeInTheDocument()
    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
    expect(screen.getByText('Average rating')).toBeInTheDocument()
  })

  it('renders all icons', () => {
    render(<DashboardOverview />)
    
    expect(screen.getByTestId('ticket-icon')).toBeInTheDocument()
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
    expect(screen.getByTestId('target-icon')).toBeInTheDocument()
    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    expect(screen.getByTestId('message-square-icon')).toBeInTheDocument()
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument()
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument()
  })

  it('has proper accessibility structure', () => {
    render(<DashboardOverview />)
    
    // Check that stats are properly structured
    const cards = screen.getAllByRole('generic')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('applies hover effects classes', () => {
    const { container } = render(<DashboardOverview />)
    
    // Check that cards have hover classes
    const cards = container.querySelectorAll('.hover\\:shadow-md')
    expect(cards.length).toBe(8) // Should have 8 stat cards
  })
})