import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { put } from '@vercel/blob'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateAudioFile } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('audio') as File
    const podcastId = formData.get('podcastId') as string
    const title = formData.get('title') as string

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Validate audio file
    const validation = validateAudioFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check user's credit limit
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate estimated credit usage (approximate duration in hours)
    const estimatedHours = Math.ceil(file.size / (1024 * 1024 * 10)) // Rough estimate
    
    if (user.creditsUsed + estimatedHours > user.monthlyCredits) {
      return NextResponse.json({ 
        error: 'Credit limit exceeded. Please upgrade your plan.' 
      }, { status: 403 })
    }

    // Upload file to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    })

    // Create episode record
    const episode = await prisma.episode.create({
      data: {
        userId: user.id,
        podcastId: podcastId || '',
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        audioUrl: blob.url,
        audioFileName: file.name,
        audioFileSize: file.size,
        audioMimeType: file.type,
        processingStatus: 'PENDING'
      }
    })

    // Create processing job
    await prisma.processingJob.create({
      data: {
        episodeId: episode.id,
        jobType: 'TRANSCRIPTION',
        status: 'QUEUED',
      }
    })

    return NextResponse.json({
      episodeId: episode.id,
      audioUrl: blob.url,
      fileName: file.name,
      fileSize: file.size,
      status: 'uploaded'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload audio file' },
      { status: 500 }
    )
  }
}