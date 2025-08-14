import { NextRequest } from 'next/server'
import { initializeSocket } from '@/lib/socket-server'

export async function GET(request: NextRequest) {
  // This endpoint is used to initialize the Socket.IO server
  // The actual Socket.IO server is initialized in the server setup
  return new Response('Socket.IO server endpoint', { status: 200 })
}