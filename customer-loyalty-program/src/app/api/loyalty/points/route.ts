import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { LoyaltyEngine } from '@/lib/loyalty-engine'
import { z } from 'zod'

const awardPointsSchema = z.object({
  points: z.number().positive(),
  description: z.string().optional(),
  eventType: z.string().optional(),
  eventData: z.record(z.any()).optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { points, description, eventType, eventData } = awardPointsSchema.parse(body)
    
    // For demo purposes, using a default program ID
    // In production, this would come from the business context
    const programId = 'default-program'
    const loyaltyEngine = new LoyaltyEngine(programId)

    if (eventType) {
      // Process earning event
      const earnedPoints = await loyaltyEngine.processEarningEvent(
        session.user.id,
        eventType,
        eventData || {}
      )
      
      return NextResponse.json({ 
        success: true, 
        pointsEarned: earnedPoints,
        message: `Earned ${earnedPoints} points from ${eventType}` 
      })
    } else {
      // Direct points award
      await loyaltyEngine.awardPoints(
        session.user.id,
        points,
        'EARNED',
        description
      )
      
      return NextResponse.json({ 
        success: true, 
        pointsEarned: points,
        message: `Awarded ${points} points` 
      })
    }
  } catch (error: any) {
    console.error('Error awarding points:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to award points',
      message: error.message 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programId = 'default-program'
    const loyaltyEngine = new LoyaltyEngine(programId)
    
    const stats = await loyaltyEngine.getMembershipStats(session.user.id)
    
    return NextResponse.json({ success: true, data: stats })
  } catch (error: any) {
    console.error('Error fetching membership stats:', error)
    
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      message: error.message 
    }, { status: 500 })
  }
}