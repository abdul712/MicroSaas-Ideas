import { render, screen } from '@testing-library/react'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'

const mockStats = {
  totalPortals: 5,
  activeClients: 12,
  totalFiles: 48,
  storageUsed: 1024 * 1024 * 500, // 500MB
  messagesThisMonth: 23,
  portalViews: 156
}

describe('DashboardStats', () => {
  it('renders all stat cards', () => {
    render(<DashboardStats stats={mockStats} />)
    
    expect(screen.getByText('Total Portals')).toBeInTheDocument()
    expect(screen.getByText('Active Clients')).toBeInTheDocument()
    expect(screen.getByText('Total Files')).toBeInTheDocument()
    expect(screen.getByText('Storage Used')).toBeInTheDocument()
    expect(screen.getByText('Messages')).toBeInTheDocument()
    expect(screen.getByText('Portal Views')).toBeInTheDocument()
  })

  it('displays correct values', () => {
    render(<DashboardStats stats={mockStats} />)
    
    expect(screen.getByText('5')).toBeInTheDocument() // totalPortals
    expect(screen.getByText('12')).toBeInTheDocument() // activeClients
    expect(screen.getByText('48')).toBeInTheDocument() // totalFiles
    expect(screen.getByText('500 MB')).toBeInTheDocument() // storageUsed
    expect(screen.getByText('23')).toBeInTheDocument() // messagesThisMonth
    expect(screen.getByText('156')).toBeInTheDocument() // portalViews
  })

  it('shows trend information', () => {
    render(<DashboardStats stats={mockStats} />)
    
    expect(screen.getByText('+2 this week')).toBeInTheDocument()
    expect(screen.getByText('+1 this week')).toBeInTheDocument()
    expect(screen.getByText('+12 this week')).toBeInTheDocument()
  })

  it('calculates storage percentage correctly', () => {
    render(<DashboardStats stats={mockStats} />)
    
    // 500MB / 10GB = 5%
    expect(screen.getByText('5% used')).toBeInTheDocument()
  })

  it('handles zero values correctly', () => {
    const emptyStats = {
      totalPortals: 0,
      activeClients: 0,
      totalFiles: 0,
      storageUsed: 0,
      messagesThisMonth: 0,
      portalViews: 0
    }
    
    render(<DashboardStats stats={emptyStats} />)
    
    expect(screen.getAllByText('0')).toHaveLength(5) // 5 zero values
    expect(screen.getByText('0 Bytes')).toBeInTheDocument() // storage
    expect(screen.getByText('0% used')).toBeInTheDocument() // storage percentage
  })
})