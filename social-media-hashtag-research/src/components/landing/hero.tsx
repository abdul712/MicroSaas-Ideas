'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Hash, 
  TrendingUp, 
  Zap, 
  Target,
  BarChart3,
  Users,
  Sparkles,
  Search,
  Copy,
  CheckCircle
} from 'lucide-react';

const hashtagExamples = [
  '#socialmediamarketing',
  '#contentcreator',
  '#digitalmarketing',
  '#entrepreneur',
  '#smallbusiness',
  '#instagramtips'
];

const mockStats = [
  { label: 'Hashtags Analyzed', value: '2.5M+', icon: Hash },
  { label: 'Engagement Boost', value: '340%', icon: TrendingUp },
  { label: 'Active Users', value: '50K+', icon: Users },
  { label: 'Success Rate', value: '95%', icon: Target },
];

export function LandingHero() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
    }, 1500);
  };

  const copyHashtags = async (hashtags: string[]) => {
    const text = hashtags.join(' ');
    try {
      await navigator.clipboard.writeText(text);
      hashtags.forEach(tag => {
        setCopiedHashtags(prev => new Set([...prev, tag]));
      });
      setTimeout(() => {
        setCopiedHashtags(new Set());
      }, 2000);
    } catch (error) {
      console.error('Failed to copy hashtags:', error);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 gradient-bg" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      {/* Floating Hashtags Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {hashtagExamples.map((hashtag, index) => (
          <div
            key={hashtag}
            className={`absolute text-2xl font-semibold text-blue-500/20 animate-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            {hashtag}
          </div>
        ))}
      </div>

      <div className="container relative z-10 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Badge */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="px-4 py-2">
              <Sparkles className="mr-2 h-4 w-4" />
              AI-Powered Hashtag Research
            </Badge>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Find the Perfect{' '}
              <span className="gradient-text">Hashtags</span>
              <br />
              for Maximum Reach
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Discover trending hashtags, analyze competition, and boost your social media 
              engagement with our AI-powered research platform. Get 10x more visibility 
              with data-driven hashtag strategies.
            </p>
          </div>

          {/* Search Demo */}
          <div className="mx-auto max-w-lg space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Try searching: fitness, photography, or food..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <Button
                onClick={handleSearch}
                loading={isSearching}
                className="absolute right-2 top-1/2 h-8 -translate-y-1/2"
                size="sm"
              >
                {isSearching ? 'Analyzing...' : 'Search'}
              </Button>
            </div>

            {/* Mock Results */}
            {isSearching && (
              <div className="space-y-3 animate-fade-in">
                <div className="text-left p-4 glass-card rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Top Hashtag Suggestions</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyHashtags(['#fitness', '#workout', '#healthylifestyle'])}
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      Copy All
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    {['#fitness', '#workout', '#healthylifestyle'].map((tag, index) => (
                      <div key={tag} className="flex items-center justify-between p-2 bg-background rounded">
                        <div className="flex items-center space-x-3">
                          <span className="hashtag-badge">{tag}</span>
                          <div className="text-xs text-muted-foreground">
                            2.1M posts • 4.2% engagement
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="difficulty-medium">
                            Medium
                          </Badge>
                          {copiedHashtags.has(tag) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyHashtags([tag])}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="xl" variant="gradient" className="min-w-[200px]">
              <Link href="/auth/signup">
                <Zap className="mr-2 h-5 w-5" />
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button asChild size="xl" variant="outline" className="min-w-[200px]">
              <Link href="#demo">
                <BarChart3 className="mr-2 h-5 w-5" />
                View Live Demo
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="space-y-6 pt-8">
            <p className="text-sm text-muted-foreground">
              Trusted by 50,000+ content creators and businesses worldwide
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {mockStats.map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Custom styles for the floating animation
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-10px) rotate(1deg); }
    66% { transform: translateY(5px) rotate(-1deg); }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .bg-grid-pattern {
    background-image: 
      linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px);
    background-size: 50px 50px;
  }
  
  .dark .bg-grid-pattern {
    background-image: 
      linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}