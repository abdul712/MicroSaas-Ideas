import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUrl, normalizeUrl } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'temp'; // Would need proper auth

    const websites = await prisma.website.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            performanceScans: true,
            seoAudits: true,
            monitoringAlerts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(websites);

  } catch (error) {
    console.error('Get websites error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, name, description, projectId, userId = 'temp' } = body;

    // Validate input
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!validateUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeUrl(url);
    const websiteName = name || new URL(normalizedUrl).hostname;

    // Check if website already exists for this user
    const existingWebsite = await prisma.website.findFirst({
      where: {
        url: normalizedUrl,
        userId
      }
    });

    if (existingWebsite) {
      return NextResponse.json(
        { error: 'Website already exists' },
        { status: 400 }
      );
    }

    // Create or get project
    let project;
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId }
      });
    } else {
      // Create default project if none exists
      project = await prisma.project.upsert({
        where: {
          userId: userId
        },
        update: {},
        create: {
          name: 'Default Project',
          description: 'Default project for website monitoring',
          userId
        }
      });
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create website
    const website = await prisma.website.create({
      data: {
        url: normalizedUrl,
        name: websiteName,
        description,
        projectId: project.id,
        userId,
        isActive: true
      },
      include: {
        project: true,
        _count: {
          select: {
            performanceScans: true,
            seoAudits: true,
            monitoringAlerts: true
          }
        }
      }
    });

    return NextResponse.json(website, { status: 201 });

  } catch (error) {
    console.error('Create website error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    const website = await prisma.website.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      include: {
        project: true,
        _count: {
          select: {
            performanceScans: true,
            seoAudits: true,
            monitoringAlerts: true
          }
        }
      }
    });

    return NextResponse.json(website);

  } catch (error) {
    console.error('Update website error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Delete website and all related data (cascade delete is handled by Prisma schema)
    await prisma.website.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete website error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}