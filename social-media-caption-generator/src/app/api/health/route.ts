import { NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring';

export async function GET() {
  try {
    // Perform health checks
    const healthResult = await monitoring.healthCheck();
    
    const response = {
      status: healthResult.status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: healthResult.checks,
    };

    // Return appropriate status code
    const statusCode = healthResult.status === 'healthy' ? 200 : 
                      healthResult.status === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }, { status: 503 });
  }
}