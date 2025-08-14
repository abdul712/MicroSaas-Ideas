'use client';

import Link from 'next/link';
import { Hash, Twitter, Instagram, Linkedin, Github, Mail } from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'API', href: '/api' },
    { name: 'Integrations', href: '/integrations' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Help Center', href: '/help' },
    { name: 'Status', href: '/status' },
    { name: 'Changelog', href: '/changelog' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Cookies', href: '/cookies' },
    { name: 'GDPR', href: '/gdpr' },
  ],
};

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/hashtagiq', icon: Twitter },
  { name: 'Instagram', href: 'https://instagram.com/hashtagiq', icon: Instagram },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/hashtagiq', icon: Linkedin },
  { name: 'GitHub', href: 'https://github.com/hashtagiq', icon: Github },
];

export function LandingFooter() {
  return (
    <footer className="bg-background border-t">
      <div className="container py-16">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <Hash className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">HashtagIQ</span>
            </Link>
            
            <p className="text-muted-foreground max-w-md leading-relaxed">
              AI-powered hashtag research platform helping content creators and 
              businesses maximize their social media reach with data-driven insights.
            </p>
            
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <link.icon className="h-5 w-5" />
                  <span className="sr-only">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-8 lg:col-span-1">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-8 lg:col-span-1">
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-8 lg:col-span-1">
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-16 pt-8 border-t">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div className="text-center lg:text-left">
              <h3 className="font-semibold mb-2">Stay updated</h3>
              <p className="text-muted-foreground text-sm">
                Get the latest hashtag trends and social media tips delivered to your inbox.
              </p>
            </div>
            
            <div className="flex space-x-2 w-full lg:w-auto max-w-sm">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} HashtagIQ. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>🔒 SOC 2 Compliant</span>
            <span>⚡ 99.9% Uptime</span>
            <span>🌍 Global CDN</span>
          </div>
        </div>
      </div>
    </footer>
  );
}