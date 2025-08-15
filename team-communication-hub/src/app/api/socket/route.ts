import { NextRequest } from 'next/server'
import { initializeSocket } from '@/lib/socket'

export async function GET(req: NextRequest) {
  return initializeSocket(req as any, {} as any)
}

export async function POST(req: NextRequest) {
  return initializeSocket(req as any, {} as any)
}