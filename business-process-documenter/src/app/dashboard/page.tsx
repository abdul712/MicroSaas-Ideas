import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DashboardOverview from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Get dashboard stats
  const [totalProcesses, recentProcesses, recentExecutions] = await Promise.all([
    prisma.process.count({
      where: {
        organizationId: session.user.organizationId,
      },
    }),
    prisma.process.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            steps: true,
            executions: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    }),
    prisma.processExecution.findMany({
      where: {
        process: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        process: {
          select: {
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  const dashboardData = {
    totalProcesses,
    recentProcesses,
    recentExecutions,
    stats: {
      totalExecutions: recentExecutions.length,
      completedExecutions: recentExecutions.filter(e => e.status === "COMPLETED").length,
      avgExecutionTime: 45, // Mock data
    },
  };

  return (
    <DashboardLayout>
      <DashboardOverview data={dashboardData} />
    </DashboardLayout>
  );
}