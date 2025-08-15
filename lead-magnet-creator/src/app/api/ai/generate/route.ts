import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateContent, ContentGenerationRequest } from '@/services/openai'
import { z } from 'zod'

const generateRequestSchema = z.object({
  type: z.enum(['EBOOK', 'CHECKLIST', 'TEMPLATE', 'CALCULATOR', 'INFOGRAPHIC']),
  topic: z.string().min(1, 'Topic is required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative']),
  length: z.enum(['short', 'medium', 'long']),
  industry: z.string().optional(),
  keywords: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = generateRequestSchema.parse(body)

    const generationRequest: ContentGenerationRequest = {
      ...validatedData,
      organizationId: session.user.organizationId,
    }

    const result = await generateContent(generationRequest)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Content generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}