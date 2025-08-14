import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { LoyaltyEngine } from '@/lib/loyalty-engine'
import { z } from 'zod'

const redeemSchema = z.object({
  rewardId: z.string()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { rewardId } = redeemSchema.parse(body)
    
    const programId = 'default-program'
    const loyaltyEngine = new LoyaltyEngine(programId)
    
    const result = await loyaltyEngine.redeemPoints(session.user.id, rewardId)
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        redemptionId: result.redemptionId,
        message: 'Reward redeemed successfully!' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error redeeming reward:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to redeem reward',
      message: error.message 
    }, { status: 500 })
  }
}