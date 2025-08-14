'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Menu, X, Hash, Zap, TrendingUp } from 'lucide-react';

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
            <Hash className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">HashtagIQ</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Reviews
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Blog
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {session ? (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/api/auth/signout">Sign Out</Link>
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button asChild variant="ghost">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild variant="gradient">
                <Link href="/auth/signup">
                  <Zap className="mr-2 h-4 w-4" />
                  Get Started
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 space-y-4">
            <Link
              href="#features"
              className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#testimonials"
              className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Reviews
            </Link>
            <Link
              href="/blog"
              className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            
            <div className="pt-4 space-y-2">
              {session ? (
                <>
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/api/auth/signout" onClick={() => setIsMenuOpen(false)}>
                      Sign Out
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild variant="gradient" className="w-full justify-start">
                    <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                      <Zap className="mr-2 h-4 w-4" />
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}