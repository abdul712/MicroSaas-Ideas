import { type NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function createContext(req: NextRequest) {
  const session = await getServerSession(authOptions)

  return {
    req,
    session,
    prisma,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>