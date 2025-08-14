import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getReceiptProcessor } from '@/lib/ocr'
import { validateFile } from '@/lib/storage'
import { uploadRateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    try {
      await uploadRateLimit.limit(session.user.id)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
        { 
          status: 429,
          headers: error.headers || {},
        }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate file
    const validation = validateFile(buffer, file.name)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Check organization limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          select: {
            subscriptionTier: true,
            maxExpensesPerMonth: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check monthly upload limit based on subscription
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const uploadsThisMonth = await prisma.receipt.count({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: currentMonth,
        },
      },
    })

    if (uploadsThisMonth >= user.organization.maxExpensesPerMonth) {
      return NextResponse.json(
        { 
          error: 'Monthly upload limit exceeded. Please upgrade your subscription.',
          limit: user.organization.maxExpensesPerMonth,
          used: uploadsThisMonth,
        },
        { status: 429 }
      )
    }

    // Process receipt with OCR
    const receiptProcessor = await getReceiptProcessor()
    const receiptId = await receiptProcessor.processReceipt(
      buffer,
      file.name,
      session.user.id,
      session.user.organizationId
    )

    // Retrieve the processed receipt with extracted data
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt processing failed' },
        { status: 500 }
      )
    }

    // Log the upload activity
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'Receipt',
        resourceId: receiptId,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        newValues: {
          filename: receipt.filename,
          fileSize: receipt.fileSize,
          ocrStatus: receipt.ocrStatus,
          extractedAmount: receipt.extractedAmount,
          extractedMerchant: receipt.extractedMerchant,
        },
      },
    })

    // Prepare response
    const response = {
      id: receipt.id,
      filename: receipt.filename,
      fileSize: receipt.fileSize,
      thumbnailUrl: receipt.thumbnailUrl,
      ocrStatus: receipt.ocrStatus,
      extractedData: {
        amount: receipt.extractedAmount,
        date: receipt.extractedDate,
        merchant: receipt.extractedMerchant,
        tax: receipt.extractedTax,
        confidence: receipt.confidence,
      },
      processingTime: receipt.processingTime,
      createdAt: receipt.createdAt,
      uploadedBy: `${receipt.user.firstName} ${receipt.user.lastName}`.trim(),
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Receipt upload error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Get receipts for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (status && ['PROCESSING', 'COMPLETED', 'FAILED', 'MANUAL_REVIEW'].includes(status)) {
      where.ocrStatus = status
    }

    if (userId) {
      where.userId = userId
    }

    // If not admin, only show user's own receipts
    if (session.user.role === 'USER') {
      where.userId = session.user.id
    }

    const [receipts, totalCount] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          expense: {
            select: {
              id: true,
              amount: true,
              description: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.receipt.count({ where }),
    ])

    const response = {
      data: receipts.map(receipt => ({
        id: receipt.id,
        filename: receipt.filename,
        originalFilename: receipt.originalFilename,
        fileSize: receipt.fileSize,
        thumbnailUrl: receipt.thumbnailUrl,
        ocrStatus: receipt.ocrStatus,
        extractedData: {
          amount: receipt.extractedAmount,
          date: receipt.extractedDate,
          merchant: receipt.extractedMerchant,
          tax: receipt.extractedTax,
          confidence: receipt.confidence,
        },
        processingTime: receipt.processingTime,
        createdAt: receipt.createdAt,
        processedAt: receipt.processedAt,
        uploadedBy: `${receipt.user.firstName} ${receipt.user.lastName}`.trim(),
        linkedExpense: receipt.expense ? {
          id: receipt.expense.id,
          amount: receipt.expense.amount,
          description: receipt.expense.description,
          status: receipt.expense.status,
        } : null,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get receipts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}