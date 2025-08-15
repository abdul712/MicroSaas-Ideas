import { render, screen, fireEvent } from '@testing-library/react'
import { LandingPage } from '../landing/landing-page'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
}))

describe('LandingPage', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    jest.clearAllMocks()
  })

  it('renders the main heading', () => {
    render(<LandingPage />)
    
    expect(screen.getByText(/Transform Your Online Reputation/)).toBeInTheDocument()
  })

  it('renders navigation elements', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('ReviewManager')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('renders the hero section with call-to-action buttons', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument()
    expect(screen.getByText('Watch Demo')).toBeInTheDocument()
  })

  it('renders the features section', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('Multi-Platform Monitoring')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered Responses')).toBeInTheDocument()
    expect(screen.getByText('Real-Time Alerts')).toBeInTheDocument()
    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument()
  })

  it('renders platform showcase', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('Monitor Reviews Across All Major Platforms')).toBeInTheDocument()
    expect(screen.getByText('Google My Business')).toBeInTheDocument()
    expect(screen.getByText('Facebook')).toBeInTheDocument()
    expect(screen.getByText('Yelp')).toBeInTheDocument()
    expect(screen.getByText('TripAdvisor')).toBeInTheDocument()
  })

  it('renders benefits section', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('Save 20+ Hours/Week')).toBeInTheDocument()
    expect(screen.getByText('40% More Reviews')).toBeInTheDocument()
    expect(screen.getByText('Higher Star Ratings')).toBeInTheDocument()
    expect(screen.getByText('Better Customer Trust')).toBeInTheDocument()
  })

  it('renders testimonials section', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('Loved by Business Owners')).toBeInTheDocument()
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    expect(screen.getByText('Michael Chen')).toBeInTheDocument()
    expect(screen.getByText('Emily Davis')).toBeInTheDocument()
  })

  it('renders pricing section with three plans', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('Simple, Transparent Pricing')).toBeInTheDocument()
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
    expect(screen.getByText('Most Popular')).toBeInTheDocument()
  })

  it('renders footer with company information', () => {
    render(<LandingPage />)
    
    expect(screen.getByText(/© 2024 ReviewManager. All rights reserved./)).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByText('Company')).toBeInTheDocument()
  })

  it('handles feature selection interaction', () => {
    render(<LandingPage />)
    
    // Find feature cards and click on one
    const featureCard = screen.getByText('AI-Powered Responses').closest('div')
    expect(featureCard).toBeInTheDocument()
    
    if (featureCard) {
      fireEvent.click(featureCard)
      // Feature selection should update the active state
      expect(featureCard).toHaveClass('bg-primary/5')
    }
  })

  it('renders all call-to-action buttons', () => {
    render(<LandingPage />)
    
    // Count all "Start Free Trial" buttons
    const ctaButtons = screen.getAllByText('Start Free Trial')
    expect(ctaButtons.length).toBeGreaterThan(1)
    
    // Check for "Start Your Free Trial" in the final CTA section
    expect(screen.getByText('Start Your Free Trial')).toBeInTheDocument()
  })

  it('renders security badges', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('SSL Secured')).toBeInTheDocument()
    expect(screen.getByText('GDPR Compliant')).toBeInTheDocument()
    expect(screen.getByText('Mobile Ready')).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(<LandingPage />)
    
    // Check for semantic HTML elements
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders pricing information correctly', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('$29')).toBeInTheDocument()
    expect(screen.getByText('$79')).toBeInTheDocument()
    expect(screen.getByText('$199')).toBeInTheDocument()
    
    expect(screen.getByText('per month')).toBeInTheDocument()
  })

  it('displays feature statistics', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('15+ Platforms')).toBeInTheDocument()
    expect(screen.getByText('95% Accuracy')).toBeInTheDocument()
    expect(screen.getByText('< 1 Min Alert')).toBeInTheDocument()
    expect(screen.getByText('50+ Metrics')).toBeInTheDocument()
  })
})