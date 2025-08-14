import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import ProcessList from "@/components/processes/process-list";

export default async function ProcessesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const processes = await prisma.process.findMany({
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
  });

  return (
    <DashboardLayout>
      <ProcessList processes={processes} />
    </DashboardLayout>
  );
}