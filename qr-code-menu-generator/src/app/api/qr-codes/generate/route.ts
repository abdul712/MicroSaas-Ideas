import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QRCodeService } from '@/services/qr-code'
import { generateRandomCode } from '@/lib/utils'
import { z } from 'zod'

const generateQRSchema = z.object({
  restaurantId: z.string().cuid(),
  menuId: z.string().cuid(),
  tableNumber: z.string().optional(),
  description: z.string().optional(),
  options: z.object({
    size: z.number().min(100).max(1000).optional(),
    margin: z.number().min(0).max(10).optional(),
    color: z.object({
      dark: z.string().optional(),
      light: z.string().optional(),
    }).optional(),
    errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = generateQRSchema.parse(body)

    // Check if user owns the restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: validatedData.restaurantId,
        ownerId: session.user.id,
      },
      include: {
        menus: {
          where: {
            id: validatedData.menuId,
          },
        },
      },
    })

    if (!restaurant || restaurant.menus.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant or menu not found' },
        { status: 404 }
      )
    }

    // Generate QR code
    const qrResult = await QRCodeService.generateMenuQR(
      restaurant.slug,
      validatedData.menuId,
      validatedData.tableNumber,
      validatedData.options
    )

    // Save QR code to database
    const qrCode = await prisma.qrCode.create({
      data: {
        code: generateRandomCode(12),
        shortUrl: qrResult.shortUrl,
        tableNumber: validatedData.tableNumber,
        description: validatedData.description,
        restaurantId: validatedData.restaurantId,
        menuId: validatedData.menuId,
      },
    })

    return NextResponse.json({
      id: qrCode.id,
      code: qrCode.code,
      shortUrl: qrCode.shortUrl,
      tableNumber: qrCode.tableNumber,
      description: qrCode.description,
      dataUrl: qrResult.dataUrl,
      svg: qrResult.svg,
      menuUrl: QRCodeService.getMenuUrl(restaurant.slug, validatedData.tableNumber),
      createdAt: qrCode.createdAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 })
    }

    // Check if user owns the restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: session.user.id,
      },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const qrCodes = await prisma.qrCode.findMany({
      where: {
        restaurantId,
      },
      include: {
        menu: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            scans: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(qrCodes)
  } catch (error) {
    console.error('Error fetching QR codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}