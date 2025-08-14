import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: { apiKey: string } }
) {
  try {
    const { apiKey } = params;

    if (!apiKey || !apiKey.startsWith('sp_')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `widget_config:${apiKey}`;
    const cachedConfig = await redis.get(cacheKey);
    
    if (cachedConfig) {
      return NextResponse.json(JSON.parse(cachedConfig));
    }

    // Find organization by API key
    const organization = await prisma.organization.findUnique({
      where: { apiKey },
      include: {
        widgets: {
          where: { isActive: true },
          include: {
            campaigns: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Build widget configuration
    const config = {
      organizationId: organization.id,
      settings: organization.settings,
      widgets: organization.widgets.map((widget) => ({
        id: widget.id,
        domain: widget.domain,
        settings: widget.settings,
        campaigns: widget.campaigns.map((campaign) => ({
          id: campaign.id,
          type: campaign.type,
          rules: campaign.rules,
          settings: campaign.settings,
        })),
      })),
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify({ config }));

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Widget config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}