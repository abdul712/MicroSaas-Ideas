import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../ui/button';

describe('Button Component', () => {
  it('renders button with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies default variant styles', () => {
    render(<Button>Default</Button>);
    const button = screen.getByText('Default');
    expect(button).toHaveClass('bg-primary');
  });

  it('applies outline variant styles', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByText('Outline');
    expect(button).toHaveClass('border');
  });

  it('applies destructive variant styles', () => {
    render(<Button variant="destructive">Destructive</Button>);
    const button = screen.getByText('Destructive');
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies small size styles', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByText('Small');
    expect(button).toHaveClass('h-9');
  });

  it('applies large size styles', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByText('Large');
    expect(button).toHaveClass('h-11');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByText('Link Button');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('merges custom className with default styles', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByText('Custom');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('inline-flex'); // Default class
  });

  it('passes through additional props', () => {
    render(<Button data-testid="test-button" type="submit">Submit</Button>);
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('applies icon size styles', () => {
    render(<Button size="icon">🏠</Button>);
    const button = screen.getByText('🏠');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('w-10');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByText('Ghost');
    expect(button).toHaveClass('hover:bg-accent');
  });

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-secondary');
  });

  it('applies link variant styles', () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByText('Link');
    expect(button).toHaveClass('underline-offset-4');
  });
});