'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CallInterface } from '@/components/call/call-interface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Users, BarChart3, Settings, Shield } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Business Phone System
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Cloud-based business phone system with VoIP capabilities, call management, 
              team collaboration, and advanced analytics for modern workplaces.
            </p>
            <Button size="lg" onClick={() => router.push('/auth/signin')}>
              Get Started
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardHeader>
                <Phone className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>VoIP Calling</CardTitle>
                <CardDescription>
                  Browser-based calling with WebRTC technology for crystal clear voice and video calls.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Seamless team communication with presence indicators, messaging, and conference calling.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Analytics & Reporting</CardTitle>
                <CardDescription>
                  Comprehensive analytics for call volumes, team performance, and business insights.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Call Management</CardTitle>
                <CardDescription>
                  Advanced call routing, forwarding, voicemail, and auto-attendant features.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  End-to-end encryption, HIPAA compliance, and enterprise-grade security measures.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Phone className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Multi-Platform</CardTitle>
                <CardDescription>
                  Web, desktop, and mobile applications for seamless communication anywhere.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Phone className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Business Phone System</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {session.user?.name || session.user?.email}
            </span>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Call Interface */}
          <div className="lg:col-span-2">
            <CallInterface />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Team Directory
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Call Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Extension Status</CardTitle>
              </CardHeader>
              <CardContent>
                {session.user?.extension ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Extension:</strong> {session.user.extension.number}
                    </p>
                    <p className="text-sm">
                      <strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        session.user.extension.status === 'AVAILABLE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.user.extension.status}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No extension assigned
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}