import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { ChannelView } from "@/components/channel/channel-view";

interface ChannelPageProps {
  params: {
    teamSlug: string;
    channelId: string;
  };
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Verify user has access to this channel
  const channel = await db.channel.findUnique({
    where: {
      id: params.channelId,
    },
    include: {
      team: {
        include: {
          members: {
            where: {
              userId: session.user.id,
              status: "ACTIVE",
            },
          },
        },
      },
      members: {
        where: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!channel || channel.team.slug !== params.teamSlug) {
    redirect("/teams");
  }

  // Check if user is a team member
  if (channel.team.members.length === 0) {
    redirect("/teams");
  }

  // For private channels, check if user is a channel member
  if (channel.type === "PRIVATE" && channel.members.length === 0) {
    redirect(`/workspace/${params.teamSlug}`);
  }

  return <ChannelView channelId={params.channelId} />;
}