import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LandingPage } from "@/components/landing/landing-page";
import { db } from "@/lib/prisma";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If user is authenticated, check if they have teams
  if (session?.user?.id) {
    // Find user's teams
    const userTeams = await db.teamMember.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: {
        team: true,
      },
      take: 1,
    });

    // If user has teams, redirect to the first team's workspace
    if (userTeams.length > 0) {
      const team = userTeams[0].team;
      redirect(`/workspace/${team.slug}`);
    }

    // If user is authenticated but has no teams, redirect to team selection
    redirect("/teams");
  }

  // Show landing page for non-authenticated users
  return <LandingPage />;
}