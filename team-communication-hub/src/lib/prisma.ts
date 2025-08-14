import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database utility functions
export async function createTeam(data: {
  name: string;
  subdomain: string;
  ownerId: string;
  description?: string;
}) {
  return await prisma.team.create({
    data: {
      name: data.name,
      subdomain: data.subdomain,
      description: data.description,
      members: {
        create: {
          userId: data.ownerId,
          role: 'OWNER',
        },
      },
      channels: {
        create: {
          name: 'general',
          description: 'General team discussions',
          type: 'PUBLIC',
          createdBy: data.ownerId,
          members: {
            create: {
              userId: data.ownerId,
              role: 'ADMIN',
            },
          },
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      channels: true,
    },
  });
}

export async function getUserTeams(userId: string) {
  return await prisma.teamMember.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      team: {
        include: {
          _count: {
            select: {
              members: true,
              channels: true,
            },
          },
        },
      },
    },
  });
}

export async function getTeamChannels(teamId: string, userId: string) {
  // Get channels where user is a member
  return await prisma.channel.findMany({
    where: {
      teamId,
      isArchived: false,
      OR: [
        { type: 'PUBLIC' },
        {
          type: 'PRIVATE',
          members: {
            some: { userId },
          },
        },
      ],
    },
    include: {
      _count: {
        select: {
          members: true,
          messages: true,
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getChannelMessages(
  channelId: string,
  limit: number = 50,
  cursor?: string
) {
  return await prisma.message.findMany({
    where: {
      channelId,
      isDeleted: false,
    },
    take: limit,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          status: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      attachments: {
        include: {
          file: true,
        },
      },
      mentions: true,
    },
  });
}

export async function createMessage(data: {
  content: string;
  senderId: string;
  channelId: string;
  teamId: string;
  threadId?: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | 'AI_RESPONSE';
}) {
  return await prisma.message.create({
    data: {
      content: data.content,
      senderId: data.senderId,
      channelId: data.channelId,
      teamId: data.teamId,
      threadId: data.threadId,
      type: data.type || 'TEXT',
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          status: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      attachments: {
        include: {
          file: true,
        },
      },
    },
  });
}

export async function updateUserPresence(
  userId: string,
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE',
  activity?: string
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      lastActiveAt: new Date(),
    },
  });

  await prisma.presenceUpdate.create({
    data: {
      userId,
      status,
      activity,
    },
  });
}

export async function getTeamMembers(teamId: string) {
  return await prisma.teamMember.findMany({
    where: {
      teamId,
      status: 'ACTIVE',
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          status: true,
          lastActiveAt: true,
        },
      },
    },
    orderBy: {
      user: {
        lastActiveAt: 'desc',
      },
    },
  });
}

export async function searchMessages(
  teamId: string,
  query: string,
  limit: number = 20
) {
  return await prisma.message.findMany({
    where: {
      teamId,
      isDeleted: false,
      content: {
        contains: query,
        mode: 'insensitive',
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      channel: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });
}

export async function logActivity(data: {
  userId?: string;
  teamId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  return await prisma.activityLog.create({
    data: {
      userId: data.userId,
      teamId: data.teamId,
      action: data.action as any,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
}

// Team usage tracking
export async function updateTeamUsage(
  teamId: string,
  updates: {
    messageCount?: number;
    activeUsers?: number;
    storageUsed?: bigint;
    apiCalls?: number;
  }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.teamUsage.upsert({
    where: {
      teamId_date: {
        teamId,
        date: today,
      },
    },
    update: {
      messageCount: updates.messageCount ? { increment: updates.messageCount } : undefined,
      activeUsers: updates.activeUsers,
      storageUsed: updates.storageUsed ? { increment: updates.storageUsed } : undefined,
      apiCalls: updates.apiCalls ? { increment: updates.apiCalls } : undefined,
    },
    create: {
      teamId,
      date: today,
      messageCount: updates.messageCount || 0,
      activeUsers: updates.activeUsers || 0,
      storageUsed: updates.storageUsed || BigInt(0),
      apiCalls: updates.apiCalls || 0,
    },
  });
}

// Cleanup old data
export async function cleanupOldData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Clean up old presence updates
  await prisma.presenceUpdate.deleteMany({
    where: {
      timestamp: {
        lt: thirtyDaysAgo,
      },
    },
  });

  // Clean up old activity logs (keep for 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  await prisma.activityLog.deleteMany({
    where: {
      timestamp: {
        lt: ninetyDaysAgo,
      },
    },
  });
}