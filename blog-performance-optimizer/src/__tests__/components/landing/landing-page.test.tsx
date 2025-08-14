import { render, screen } from '@testing-library/react';
import { LandingPage } from '@/components/landing/landing-page';

// Mock the providers
jest.mock('@/components/providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('LandingPage', () => {
  it('renders the main heading', () => {
    render(<LandingPage />);
    
    expect(screen.getByRole('heading', { 
      name: /supercharge your blog performance/i 
    })).toBeInTheDocument();
  });

  it('renders key features', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
    expect(screen.getByText('SEO Optimization')).toBeInTheDocument();
    expect(screen.getByText('Accessibility Compliance')).toBeInTheDocument();
    expect(screen.getByText('Real-time Monitoring')).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(<LandingPage />);
    
    expect(screen.getByRole('button', { name: /start free analysis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /watch demo/i })).toBeInTheDocument();
  });

  it('renders demo dashboard preview', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('Performance Score')).toBeInTheDocument();
    expect(screen.getByText('SEO Score')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
  });

  it('renders testimonials section', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('Loved by Blog Owners Worldwide')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mike Chen')).toBeInTheDocument();
    expect(screen.getByText('Emily Rodriguez')).toBeInTheDocument();
  });

  it('renders footer with company info', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('BlogOptimizer')).toBeInTheDocument();
    expect(screen.getByText(/the ultimate platform for blog performance/i)).toBeInTheDocument();
  });

  it('renders navigation menu', () => {
    render(<LandingPage />);
    
    expect(screen.getByRole('link', { name: /features/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pricing/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /testimonials/i })).toBeInTheDocument();
  });
});