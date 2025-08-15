import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational'
      },
      version: process.env.npm_package_version || '1.0.0'
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    const health = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        api: 'operational'
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json(health, { status: 503 })
  }
}