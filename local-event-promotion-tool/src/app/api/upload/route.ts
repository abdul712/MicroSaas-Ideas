import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { uploadEventImage, uploadOrganizationLogo, uploadUserAvatar, getPresignedUploadUrl, validateImageFile } from '@/lib/s3'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadType = formData.get('type') as string
    const entityId = formData.get('entityId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!uploadType || !entityId) {
      return NextResponse.json(
        { error: 'Missing upload type or entity ID' },
        { status: 400 }
      )
    }

    // Validate file type and size
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let uploadResult
    let dbRecord

    switch (uploadType) {
      case 'event-image':
        // Verify user has access to the event
        const event = await prisma.event.findFirst({
          where: {
            id: entityId,
            organization: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
                },
              },
            },
          },
        })

        if (!event) {
          return NextResponse.json(
            { error: 'Event not found or access denied' },
            { status: 404 }
          )
        }

        uploadResult = await uploadEventImage(
          entityId,
          buffer,
          file.name,
          file.type
        )

        // Save to database
        dbRecord = await prisma.eventImage.create({
          data: {
            eventId: entityId,
            url: uploadResult.url,
            alt: file.name,
            width: null, // Would need image processing to get dimensions
            height: null,
            size: file.size,
            mimeType: file.type,
            isPrimary: false,
            order: 0,
          },
        })
        break

      case 'organization-logo':
        // Verify user has access to the organization
        const organization = await prisma.organization.findFirst({
          where: {
            id: entityId,
            members: {
              some: {
                userId: session.user.id,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        })

        if (!organization) {
          return NextResponse.json(
            { error: 'Organization not found or access denied' },
            { status: 404 }
          )
        }

        uploadResult = await uploadOrganizationLogo(
          entityId,
          buffer,
          file.name,
          file.type
        )

        // Update organization logo in database
        await prisma.organization.update({
          where: { id: entityId },
          data: { logo: uploadResult.url },
        })
        break

      case 'user-avatar':
        // Verify user is uploading their own avatar
        if (entityId !== session.user.id) {
          return NextResponse.json(
            { error: 'Can only upload your own avatar' },
            { status: 403 }
          )
        }

        uploadResult = await uploadUserAvatar(
          entityId,
          buffer,
          file.name,
          file.type
        )

        // Update user image in database
        await prisma.user.update({
          where: { id: entityId },
          data: { image: uploadResult.url },
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid upload type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      record: dbRecord,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

// Generate presigned upload URLs for direct client uploads
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const uploadType = searchParams.get('type')
    const entityId = searchParams.get('entityId')
    const fileName = searchParams.get('fileName')
    const contentType = searchParams.get('contentType')

    if (!uploadType || !entityId || !fileName || !contentType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Generate unique key for upload
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 6)
    const fileExtension = fileName.split('.').pop()
    
    let key: string

    switch (uploadType) {
      case 'event-image':
        // Verify access to event
        const event = await prisma.event.findFirst({
          where: {
            id: entityId,
            organization: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
                },
              },
            },
          },
        })

        if (!event) {
          return NextResponse.json(
            { error: 'Event not found or access denied' },
            { status: 404 }
          )
        }

        key = `events/${entityId}/images/${timestamp}-${randomId}.${fileExtension}`
        break

      case 'organization-logo':
        // Verify access to organization
        const organization = await prisma.organization.findFirst({
          where: {
            id: entityId,
            members: {
              some: {
                userId: session.user.id,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        })

        if (!organization) {
          return NextResponse.json(
            { error: 'Organization not found or access denied' },
            { status: 404 }
          )
        }

        key = `organizations/${entityId}/logo.${fileExtension}`
        break

      case 'user-avatar':
        if (entityId !== session.user.id) {
          return NextResponse.json(
            { error: 'Can only upload your own avatar' },
            { status: 403 }
          )
        }

        key = `users/${entityId}/avatar.${fileExtension}`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid upload type' },
          { status: 400 }
        )
    }

    const presignedUrl = await getPresignedUploadUrl(key, contentType)

    return NextResponse.json({
      success: true,
      uploadUrl: presignedUrl.uploadUrl,
      key: presignedUrl.key,
      publicUrl: presignedUrl.publicUrl,
    })

  } catch (error) {
    console.error('Presigned URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}