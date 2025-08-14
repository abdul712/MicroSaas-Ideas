import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'

export async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Authorization token required' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)
  const user = await getUserFromToken(token)

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  if (!user.isActive) {
    return NextResponse.json(
      { success: false, error: 'Account is deactivated' },
      { status: 401 }
    )
  }

  return user
}

export function withAuth(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const userOrError = await authenticate(request)
    
    if (userOrError instanceof NextResponse) {
      return userOrError
    }

    return handler(request, userOrError)
  }
}