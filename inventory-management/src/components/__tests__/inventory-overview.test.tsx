import { render, screen } from '@testing-library/react'
import { InventoryOverview } from '@/components/dashboard/inventory-overview'

// Mock the utils module
jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
  formatNumber: (value: number) => value.toLocaleString(),
}))

describe('InventoryOverview', () => {
  it('renders all overview cards', () => {
    render(<InventoryOverview />)
    
    // Check if all cards are rendered
    expect(screen.getByText('Total Products')).toBeInTheDocument()
    expect(screen.getByText('Total Value')).toBeInTheDocument()
    expect(screen.getByText('Low Stock Items')).toBeInTheDocument()
    expect(screen.getByText('Out of Stock')).toBeInTheDocument()
  })

  it('displays formatted numbers correctly', () => {
    render(<InventoryOverview />)
    
    // Check if numbers are formatted
    expect(screen.getByText('1,247')).toBeInTheDocument()
    expect(screen.getByText('$89,751')).toBeInTheDocument()
    expect(screen.getByText('23')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows trend indicators', () => {
    render(<InventoryOverview />)
    
    // Check for trend text
    expect(screen.getByText('+12.5% from last month')).toBeInTheDocument()
    expect(screen.getByText('Need attention')).toBeInTheDocument()
    expect(screen.getByText('Urgent restock needed')).toBeInTheDocument()
  })

  it('has proper styling for warning states', () => {
    render(<InventoryOverview />)
    
    // Check for warning colors
    const lowStockValue = screen.getByText('23')
    const outOfStockValue = screen.getByText('5')
    
    expect(lowStockValue).toHaveClass('text-yellow-600')
    expect(outOfStockValue).toHaveClass('text-red-600')
  })
})