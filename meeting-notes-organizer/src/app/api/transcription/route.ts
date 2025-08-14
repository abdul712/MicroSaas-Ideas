import { NextRequest, NextResponse } from 'next/server'
import { transcriptionService } from '@/services/transcription'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const meetingId = formData.get('meetingId') as string
    const language = formData.get('language') as string || 'en'

    if (!audioFile || !meetingId) {
      return NextResponse.json(
        { error: 'Missing audio file or meeting ID' },
        { status: 400 }
      )
    }

    // Verify meeting access
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        OR: [
          { userId: session.user.id },
          {
            attendees: {
              some: {
                email: session.user.email
              }
            }
          }
        ]
      }
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Transcribe audio
    const transcriptionResult = await transcriptionService.transcribeAudio(
      buffer,
      { language }
    )

    // Extract AI insights
    const [actionItems, decisions, summary, keyTopics] = await Promise.all([
      transcriptionService.extractActionItems(transcriptionResult.text),
      transcriptionService.extractDecisions(transcriptionResult.text),
      transcriptionService.generateSummary(transcriptionResult.text),
      transcriptionService.extractKeyTopics(transcriptionResult.text),
    ])

    // Identify speakers if segments are available
    let speakerSegments = []
    if (transcriptionResult.segments) {
      speakerSegments = await transcriptionService.identifySpeakers(
        transcriptionResult.segments
      )
    }

    // Save recording to database
    const recording = await prisma.recording.create({
      data: {
        meetingId,
        userId: session.user.id,
        fileName: audioFile.name,
        fileUrl: '', // Would be set after uploading to cloud storage
        fileSize: buffer.length,
        duration: Math.floor(buffer.length / 16000), // Approximate duration
        transcription: transcriptionResult.text,
        status: 'completed',
        speakerMap: speakerSegments,
        confidence: transcriptionResult.confidence,
        language: transcriptionResult.language,
      },
    })

    // Update meeting with AI insights
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        summary,
        keyTopics,
        decisions,
        nextSteps: actionItems.slice(0, 10), // Limit to 10 action items
      },
    })

    // Create action items
    for (const actionItem of actionItems.slice(0, 10)) {
      await prisma.actionItem.create({
        data: {
          meetingId,
          assigneeId: session.user.id, // Default to current user
          createdById: session.user.id,
          title: actionItem,
          status: 'pending',
          priority: 'medium',
        },
      })
    }

    return NextResponse.json({
      success: true,
      transcription: transcriptionResult.text,
      confidence: transcriptionResult.confidence,
      language: transcriptionResult.language,
      actionItems,
      decisions,
      summary,
      keyTopics,
      speakerSegments,
      recordingId: recording.id,
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to process transcription' },
      { status: 500 }
    )
  }
}