'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Globe, 
  Plus,
  Settings,
  BarChart3,
  Shield,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { AddWebsiteModal } from './add-website-modal';

interface Website {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  _count: {
    performanceScans: number;
    seoAudits: number;
    monitoringAlerts: number;
  };
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  websites: Website[];
  selectedWebsiteId: string | null;
  onWebsiteSelect: (websiteId: string) => void;
  onAddWebsite: () => void;
}

export function DashboardLayout({
  children,
  websites,
  selectedWebsiteId,
  onWebsiteSelect,
  onAddWebsite
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);

  const handleAddWebsite = async (websiteData: any) => {
    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(websiteData),
      });

      if (response.ok) {
        setShowAddModal(false);
        onAddWebsite();
      }
    } catch (error) {
      console.error('Failed to add website:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Zap className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">BlogOptimizer</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {selectedWebsite && (
                <div className="hidden sm:flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedWebsite.name}
                  </span>
                  <Badge 
                    variant={selectedWebsite.isActive ? 'success' : 'secondary'}
                    className="text-xs"
                  >
                    {selectedWebsite.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              )}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
        `}>
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 lg:hidden">
            <span className="text-lg font-semibold">Websites</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Websites</h2>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="text-xs"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {websites.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 mb-4">No websites added yet</p>
                  <Button
                    size="sm"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Website
                  </Button>
                </div>
              ) : (
                websites.map((website) => (
                  <Card
                    key={website.id}
                    className={`cursor-pointer transition-colors ${
                      selectedWebsiteId === website.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onWebsiteSelect(website.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm truncate">{website.name}</h3>
                        <Badge 
                          variant={website.isActive ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {website.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-3">{website.url}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          {website._count.performanceScans}
                        </div>
                        <div className="flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          {website._count.seoAudits}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {website._count.monitoringAlerts}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {websites.length === 0 ? (
            <div className="text-center py-16">
              <Globe className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to BlogOptimizer
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start optimizing your blog's performance, SEO, and accessibility by adding your first website.
              </p>
              <Button
                size="lg"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Website
              </Button>
            </div>
          ) : !selectedWebsiteId ? (
            <div className="text-center py-16">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Select a Website
              </h2>
              <p className="text-gray-600">
                Choose a website from the sidebar to view its performance metrics and optimization opportunities.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Add Website Modal */}
      <AddWebsiteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddWebsite}
      />
    </div>
  );
}