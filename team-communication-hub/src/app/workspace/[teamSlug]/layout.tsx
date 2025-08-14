import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

interface WorkspaceLayoutPageProps {
  children: React.ReactNode;
  params: {
    teamSlug: string;
  };
}

export default async function WorkspaceLayoutPage({
  children,
  params,
}: WorkspaceLayoutPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Verify user has access to this team
  const team = await db.team.findUnique({
    where: {
      slug: params.teamSlug,
    },
    include: {
      members: {
        where: {
          userId: session.user.id,
          status: "ACTIVE",
        },
      },
    },
  });

  if (!team || team.members.length === 0) {
    redirect("/teams");
  }

  return <WorkspaceLayout teamSlug={params.teamSlug}>{children}</WorkspaceLayout>;
}