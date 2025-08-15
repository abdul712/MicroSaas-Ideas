'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Globe, Loader2 } from 'lucide-react';
import { validateUrl, normalizeUrl } from '@/lib/utils';

interface AddWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { url: string; name: string; description?: string }) => Promise<void>;
}

export function AddWebsiteModal({ isOpen, onClose, onSubmit }: AddWebsiteModalProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ url?: string; name?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: { url?: string; name?: string } = {};
    
    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!validateUrl(normalizeUrl(url))) {
      newErrors.url = 'Please enter a valid URL';
    }
    
    if (!name.trim()) {
      newErrors.name = 'Website name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit({
        url: normalizeUrl(url),
        name: name.trim(),
        description: description.trim() || undefined
      });
      
      // Reset form
      setUrl('');
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to add website:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    
    // Auto-generate name from URL if name is empty
    if (!name && value) {
      try {
        const domain = new URL(normalizeUrl(value)).hostname;
        setName(domain.replace('www.', ''));
      } catch {
        // Invalid URL, don't auto-generate name
      }
    }
    
    // Clear URL error when user starts typing
    if (errors.url) {
      setErrors(prev => ({ ...prev, url: undefined }));
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    
    // Clear name error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">Add Website</CardTitle>
            <CardDescription>
              Add a new website to start monitoring its performance
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                Website URL *
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.url && (
                <p className="text-sm text-red-600 mt-1">{errors.url}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Website Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Blog"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your website..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-start space-x-2">
                <Badge variant="secondary" className="text-xs">
                  Info
                </Badge>
                <p className="text-sm text-blue-800">
                  After adding your website, we'll run an initial performance and SEO analysis. 
                  This may take a few minutes to complete.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Website'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}