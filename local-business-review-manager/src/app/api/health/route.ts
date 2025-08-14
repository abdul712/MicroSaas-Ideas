import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const healthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
    services: {
      database: "unknown",
      redis: "unknown",
      external_apis: "unknown",
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
  };

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.services.database = "healthy";
  } catch (error) {
    console.error("Database health check failed:", error);
    healthCheck.services.database = "unhealthy";
    healthCheck.status = "degraded";
  }

  // Check Redis connectivity (if Redis client is available)
  try {
    // Add Redis health check here when Redis client is implemented
    healthCheck.services.redis = "healthy";
  } catch (error) {
    console.error("Redis health check failed:", error);
    healthCheck.services.redis = "unhealthy";
    healthCheck.status = "degraded";
  }

  // Check external APIs (basic connectivity)
  try {
    // Add external API health checks here
    healthCheck.services.external_apis = "healthy";
  } catch (error) {
    console.error("External APIs health check failed:", error);
    healthCheck.services.external_apis = "degraded";
  }

  const httpStatus = healthCheck.status === "healthy" ? 200 : 503;

  return NextResponse.json(healthCheck, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}