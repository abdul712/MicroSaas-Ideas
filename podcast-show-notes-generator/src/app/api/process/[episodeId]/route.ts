import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/services/openai'
import { AssemblyAIService } from '@/services/assembly-ai'

export async function POST(
  request: NextRequest,
  { params }: { params: { episodeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { episodeId } = params
    const { options } = await request.json()

    // Get episode and verify ownership
    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        user: { email: session.user.email }
      },
      include: {
        podcast: true,
        user: true
      }
    })

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }

    if (episode.processingStatus === 'PROCESSING' || episode.processingStatus === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Episode is already being processed or completed' 
      }, { status: 400 })
    }

    // Update status to processing
    await prisma.episode.update({
      where: { id: episodeId },
      data: { processingStatus: 'TRANSCRIBING' }
    })

    // Start transcription process
    const openaiService = OpenAIService.getInstance()
    
    try {
      // Fetch audio file
      const audioResponse = await fetch(episode.audioUrl)
      if (!audioResponse.ok) {
        throw new Error('Failed to fetch audio file')
      }
      
      const audioBlob = await audioResponse.blob()
      const audioFile = new File([audioBlob], episode.audioFileName, {
        type: episode.audioMimeType
      })

      // Transcribe with OpenAI Whisper
      const transcriptionResult = await openaiService.transcribeAudio(audioFile)

      // Save transcription
      const transcription = await prisma.transcription.create({
        data: {
          episodeId: episode.id,
          fullText: transcriptionResult.text,
          segments: transcriptionResult.segments || [],
          language: transcriptionResult.language,
          confidenceScore: 0.95, // Placeholder - Whisper doesn't provide confidence
          processingTime: 0, // Would be calculated in real implementation
          provider: 'openai'
        }
      })

      // Update episode status
      await prisma.episode.update({
        where: { id: episodeId },
        data: { 
          processingStatus: 'GENERATING',
          duration: Math.floor(transcriptionResult.duration)
        }
      })

      // Generate show notes
      const showNotesOptions = {
        transcript: transcriptionResult.text,
        episodeTitle: episode.title,
        podcastName: episode.podcast?.name,
        duration: transcriptionResult.duration,
        template: options?.template || 'interview',
        includeTimestamps: options?.includeTimestamps ?? true,
        includeSocialContent: options?.includeSocialContent ?? true,
        targetLength: options?.targetLength || 'medium',
        seoFocus: options?.seoFocus ?? true
      }

      const showNotes = await openaiService.generateShowNotes(showNotesOptions)

      // Save show notes
      await prisma.showNotes.create({
        data: {
          episodeId: episode.id,
          summary: showNotes.summary,
          keyPoints: showNotes.keyPoints,
          timestamps: showNotes.timestamps,
          quotes: showNotes.quotes,
          linksAndResources: showNotes.linksAndResources,
          socialContent: showNotes.socialContent,
          seoMetadata: showNotes.seoMetadata,
          templateUsed: options?.template || 'interview',
          generationPrompt: 'Generated with OpenAI GPT-4'
        }
      })

      // Update episode to completed
      await prisma.episode.update({
        where: { id: episodeId },
        data: { processingStatus: 'COMPLETED' }
      })

      // Update user credits
      const creditsUsed = Math.ceil(transcriptionResult.duration / 3600) // Hours
      await prisma.user.update({
        where: { id: episode.user.id },
        data: {
          creditsUsed: {
            increment: creditsUsed
          }
        }
      })

      return NextResponse.json({
        success: true,
        episodeId,
        transcriptionId: transcription.id,
        status: 'completed',
        creditsUsed
      })

    } catch (processingError) {
      console.error('Processing error:', processingError)
      
      // Update episode to failed
      await prisma.episode.update({
        where: { id: episodeId },
        data: { 
          processingStatus: 'FAILED',
          processingError: processingError instanceof Error ? processingError.message : 'Unknown error'
        }
      })

      return NextResponse.json({
        error: 'Processing failed',
        details: processingError instanceof Error ? processingError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}