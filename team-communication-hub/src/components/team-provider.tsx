"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
  role: string;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: string;
  isDefault: boolean;
  isArchived: boolean;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    user: {
      name: string;
      username?: string;
    };
  };
}

interface TeamContextType {
  currentTeam: Team | null;
  teams: Team[];
  channels: Channel[];
  currentChannel: Channel | null;
  setCurrentTeam: (team: Team | null) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  isLoading: boolean;
  error: Error | null;
  refetchTeams: () => void;
  refetchChannels: () => void;
}

const TeamContext = createContext<TeamContextType>({
  currentTeam: null,
  teams: [],
  channels: [],
  currentChannel: null,
  setCurrentTeam: () => {},
  setCurrentChannel: () => {},
  isLoading: false,
  error: null,
  refetchTeams: () => {},
  refetchChannels: () => {},
});

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
};

interface TeamProviderProps {
  children: ReactNode;
}

export function TeamProvider({ children }: TeamProviderProps) {
  const { data: session, status } = useSession();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  // Fetch user's teams
  const {
    data: teams = [],
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = useQuery({
    queryKey: ["teams", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const response = await fetch("/api/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      return response.json();
    },
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch channels for current team
  const {
    data: channels = [],
    isLoading: channelsLoading,
    error: channelsError,
    refetch: refetchChannels,
  } = useQuery({
    queryKey: ["channels", currentTeam?.id],
    queryFn: async () => {
      if (!currentTeam?.id) return [];
      
      const response = await fetch(`/api/teams/${currentTeam.id}/channels`);
      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }
      return response.json();
    },
    enabled: !!currentTeam?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Set default team when teams are loaded
  useEffect(() => {
    if (teams.length > 0 && !currentTeam) {
      // Try to get team from URL or use first team
      const urlTeamSlug = typeof window !== "undefined" 
        ? window.location.pathname.split("/workspace/")[1]?.split("/")[0]
        : null;
      
      let teamToSet = teams.find((team: Team) => team.slug === urlTeamSlug);
      if (!teamToSet) {
        teamToSet = teams[0];
      }
      
      setCurrentTeam(teamToSet);
    }
  }, [teams, currentTeam]);

  // Set default channel when channels are loaded
  useEffect(() => {
    if (channels.length > 0 && !currentChannel) {
      // Try to get channel from URL or use default/general channel
      const urlChannelId = typeof window !== "undefined"
        ? window.location.pathname.split("/channel/")[1]?.split("/")[0]
        : null;
      
      let channelToSet = channels.find((channel: Channel) => channel.id === urlChannelId);
      if (!channelToSet) {
        channelToSet = channels.find((channel: Channel) => channel.isDefault) || channels[0];
      }
      
      setCurrentChannel(channelToSet);
    }
  }, [channels, currentChannel]);

  // Update URL when team or channel changes
  useEffect(() => {
    if (typeof window !== "undefined" && currentTeam && currentChannel) {
      const newUrl = `/workspace/${currentTeam.slug}/channel/${currentChannel.id}`;
      const currentUrl = window.location.pathname;
      
      if (currentUrl !== newUrl) {
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [currentTeam, currentChannel]);

  const isLoading = teamsLoading || channelsLoading;
  const error = teamsError || channelsError;

  const value: TeamContextType = {
    currentTeam,
    teams,
    channels,
    currentChannel,
    setCurrentTeam: (team) => {
      setCurrentTeam(team);
      setCurrentChannel(null); // Reset channel when team changes
    },
    setCurrentChannel,
    isLoading,
    error: error as Error | null,
    refetchTeams,
    refetchChannels,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}