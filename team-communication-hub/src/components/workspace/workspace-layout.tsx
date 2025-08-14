"use client";

import { ReactNode, useEffect } from "react";
import { useTeam } from "@/components/team-provider";
import { useSocket } from "@/components/socket-provider";
import { TeamSidebar } from "@/components/workspace/team-sidebar";
import { ChannelSidebar } from "@/components/workspace/channel-sidebar";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";

interface WorkspaceLayoutProps {
  children: ReactNode;
  teamSlug: string;
}

export function WorkspaceLayout({ children, teamSlug }: WorkspaceLayoutProps) {
  const { currentTeam, teams, isLoading, error, setCurrentTeam } = useTeam();
  const { isConnected } = useSocket();

  // Set the current team based on the slug
  useEffect(() => {
    if (teams.length > 0 && (!currentTeam || currentTeam.slug !== teamSlug)) {
      const team = teams.find(t => t.slug === teamSlug);
      if (team) {
        setCurrentTeam(team);
      }
    }
  }, [teams, currentTeam, teamSlug, setCurrentTeam]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!currentTeam) {
    return <ErrorScreen error={new Error("Team not found")} />;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Team Sidebar */}
      <TeamSidebar />
      
      {/* Channel Sidebar */}
      <ChannelSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <WorkspaceHeader />
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-sm text-center">
            Reconnecting to real-time messaging...
          </div>
        )}
        
        {/* Channel Content */}
        <main className="flex-1 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}