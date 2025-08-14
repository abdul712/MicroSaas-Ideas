import { render, screen, waitFor } from '@testing-library/react';
import { DashboardOverview } from '../dashboard/dashboard-overview';

// Mock the chart.js library
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-chart">Chart</div>,
}));

describe('DashboardOverview Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('shows loading skeletons initially', () => {
    render(<DashboardOverview />);
    
    // Check for loading indicators
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays metrics after loading', async () => {
    render(<DashboardOverview />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Total Reviews')).toBeInTheDocument();
    });

    // Check for key metrics
    expect(screen.getByText('Total Reviews')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
    expect(screen.getByText('Response Rate')).toBeInTheDocument();
    expect(screen.getByText('New Reviews')).toBeInTheDocument();
  });

  it('displays metric values correctly', async () => {
    render(<DashboardOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('247')).toBeInTheDocument();
    });

    // Check metric values
    expect(screen.getByText('247')).toBeInTheDocument(); // Total reviews
    expect(screen.getByText('4.6 ⭐')).toBeInTheDocument(); // Average rating
    expect(screen.getByText('85%')).toBeInTheDocument(); // Response rate
    expect(screen.getByText('12')).toBeInTheDocument(); // New reviews
  });

  it('displays recent reviews section', async () => {
    render(<DashboardOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
    });

    expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
    expect(screen.getByText('Latest reviews from all connected platforms')).toBeInTheDocument();
  });

  it('displays platform breakdown section', async () => {
    render(<DashboardOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('Platform Breakdown')).toBeInTheDocument();
    });

    expect(screen.getByText('Platform Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Review distribution across platforms')).toBeInTheDocument();
  });

  it('shows platform data correctly', async () => {
    render(<DashboardOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('Google My Business')).toBeInTheDocument();
    });

    // Check for platform names
    expect(screen.getByText('Google My Business')).toBeInTheDocument();
    expect(screen.getByText('Yelp')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('TripAdvisor')).toBeInTheDocument();
  });

  it('displays quick actions section', async () => {
    render(<DashboardOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Common tasks to manage your reviews')).toBeInTheDocument();
  });

  it('shows quick action buttons', async () => {
    render(<DashboardOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('Respond to Reviews')).toBeInTheDocument();
    });

    expect(screen.getByText('Respond to Reviews')).toBeInTheDocument();
    expect(screen.getByText('Send Invitations')).toBeInTheDocument();
    expect(screen.getByText('View Analytics')).toBeInTheDocument();
  });

  it('displays review status badges correctly', async () => {
    render(<DashboardOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('new')).toBeInTheDocument();
    });

    // Check for status badges
    expect(screen.getByText('new')).toBeInTheDocument();
    expect(screen.getByText('responded')).toBeInTheDocument();
    expect(screen.getByText('flagged')).toBeInTheDocument();
  });

  it('shows percentage changes with correct indicators', async () => {
    render(<DashboardOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('+15.2% from last month')).toBeInTheDocument();
    });

    // Check for growth indicators
    expect(screen.getByText('+15.2% from last month')).toBeInTheDocument();
    expect(screen.getByText('+0.3 from last month')).toBeInTheDocument();
    expect(screen.getByText('-2.1% from last month')).toBeInTheDocument();
    expect(screen.getByText('+25.0% from last week')).toBeInTheDocument();
  });

  it('displays customer names in reviews', async () => {
    render(<DashboardOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    // Check for customer names
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mike Wilson')).toBeInTheDocument();
  });

  it('shows view all reviews button', async () => {
    render(<DashboardOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('View All Reviews')).toBeInTheDocument();
    });

    expect(screen.getByText('View All Reviews')).toBeInTheDocument();
  });
});