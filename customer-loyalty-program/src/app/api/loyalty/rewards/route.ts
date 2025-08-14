import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { LoyaltyEngine } from '@/lib/loyalty-engine'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programId = 'default-program'
    const loyaltyEngine = new LoyaltyEngine(programId)
    
    const rewards = await loyaltyEngine.getAvailableRewards(session.user.id)
    
    return NextResponse.json({ success: true, data: rewards })
  } catch (error: any) {
    console.error('Error fetching rewards:', error)
    
    return NextResponse.json({ 
      error: 'Failed to fetch rewards',
      message: error.message 
    }, { status: 500 })
  }
}