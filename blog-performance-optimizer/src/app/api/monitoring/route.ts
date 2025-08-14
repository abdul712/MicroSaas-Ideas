import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status') || 'active';

    const where: any = {};
    
    if (websiteId) {
      where.websiteId = websiteId;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (severity) {
      where.severity = severity;
    }
    
    if (status) {
      where.status = status;
    }

    const alerts = await prisma.monitoringAlert.findMany({
      where,
      include: {
        website: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json(alerts);

  } catch (error) {
    console.error('Get monitoring alerts error:', error);
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
    const { 
      websiteId, 
      type, 
      severity, 
      title, 
      message, 
      triggerValue, 
      thresholdValue,
      metadata 
    } = body;

    // Validate required fields
    if (!websiteId || !type || !severity || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify website exists
    const website = await prisma.website.findUnique({
      where: { id: websiteId }
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Create monitoring alert
    const alert = await prisma.monitoringAlert.create({
      data: {
        websiteId,
        type,
        severity,
        title,
        message,
        triggerValue,
        thresholdValue,
        metadata: metadata as any,
        status: 'active'
      },
      include: {
        website: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      }
    });

    return NextResponse.json(alert, { status: 201 });

  } catch (error) {
    console.error('Create monitoring alert error:', error);
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Alert ID and status are required' },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    
    if (status === 'acknowledged') {
      updateData.acknowledgedAt = new Date();
    } else if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    const alert = await prisma.monitoringAlert.update({
      where: { id },
      data: updateData,
      include: {
        website: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      }
    });

    return NextResponse.json(alert);

  } catch (error) {
    console.error('Update monitoring alert error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Uptime monitoring endpoint
export async function POST_UPTIME_CHECK(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteId, url } = body;

    if (!websiteId || !url) {
      return NextResponse.json(
        { error: 'Website ID and URL are required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    let isUp = false;
    let statusCode = null;
    let errorMessage = null;

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 30000 // 30 seconds timeout
      });
      
      isUp = response.ok;
      statusCode = response.status;

      if (!isUp) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

    } catch (error) {
      isUp = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    const responseTime = Date.now() - startTime;

    // Store uptime check result
    const uptimeCheck = await prisma.uptimeCheck.create({
      data: {
        websiteId,
        isUp,
        responseTime,
        statusCode,
        errorMessage,
        checkType: 'http'
      }
    });

    // Create alert if website is down
    if (!isUp) {
      await prisma.monitoringAlert.create({
        data: {
          websiteId,
          type: 'downtime',
          severity: 'critical',
          title: 'Website Down',
          message: `Website ${url} is not responding. ${errorMessage}`,
          triggerValue: 0,
          thresholdValue: 1,
          metadata: {
            responseTime,
            statusCode,
            errorMessage,
            checkType: 'http'
          } as any
        }
      });
    }

    return NextResponse.json({
      success: true,
      uptimeCheck,
      isUp,
      responseTime,
      statusCode,
      errorMessage
    });

  } catch (error) {
    console.error('Uptime check error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}