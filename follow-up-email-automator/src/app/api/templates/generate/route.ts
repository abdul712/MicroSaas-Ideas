import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { aiEmailGenerator } from '@/services/ai-email-generator'
import { z } from 'zod'

const GenerateTemplateSchema = z.object({
  type: z.enum(['follow_up', 'welcome', 'nurture', 'promotion', 'reminder', 'thank_you']),
  recipientName: z.string().optional(),
  company: z.string().optional(),
  context: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent', 'formal']).default('professional'),
  industry: z.string().optional(),
  previousInteraction: z.string().optional(),
  callToAction: z.string().optional(),
  customVariables: z.record(z.string()).optional(),
})

const OptimizeTemplateSchema = z.object({
  content: z.string().min(1),
  metrics: z.object({
    openRate: z.number(),
    clickRate: z.number(),
    replyRate: z.number(),
  }),
})

const GenerateSubjectLinesSchema = z.object({
  baseSubject: z.string().min(1),
  count: z.number().min(1).max(10).default(5),
})

const GenerateSequenceSchema = z.object({
  sequenceType: z.string(),
  steps: z.number().min(1).max(10),
  context: z.object({
    industry: z.string().optional(),
    audience: z.string().optional(),
    goal: z.string().optional(),
    tone: z.string().optional(),
  }),
})

const AnalyzeSentimentSchema = z.object({
  content: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const body = await request.json()

    switch (action) {
      case 'content':
        return await generateContent(body)
      
      case 'optimize':
        return await optimizeContent(body)
      
      case 'subject-lines':
        return await generateSubjectLines(body)
      
      case 'sequence':
        return await generateSequence(body)
      
      case 'sentiment':
        return await analyzeSentiment(body)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateContent(body: any) {
  try {
    const data = GenerateTemplateSchema.parse(body)
    const result = await aiEmailGenerator.generateEmailContent(data)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    throw error
  }
}

async function optimizeContent(body: any) {
  try {
    const data = OptimizeTemplateSchema.parse(body)
    const result = await aiEmailGenerator.optimizeEmailContent(data.content, data.metrics)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    throw error
  }
}

async function generateSubjectLines(body: any) {
  try {
    const data = GenerateSubjectLinesSchema.parse(body)
    const result = await aiEmailGenerator.generateSubjectLineVariations(
      data.baseSubject, 
      data.count
    )
    return NextResponse.json({ variations: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    throw error
  }
}

async function generateSequence(body: any) {
  try {
    const data = GenerateSequenceSchema.parse(body)
    const result = await aiEmailGenerator.generateSequence(
      data.sequenceType,
      data.steps,
      data.context
    )
    return NextResponse.json({ sequence: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    throw error
  }
}

async function analyzeSentiment(body: any) {
  try {
    const data = AnalyzeSentimentSchema.parse(body)
    const result = await aiEmailGenerator.analyzeEmailSentiment(data.content)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    throw error
  }
}