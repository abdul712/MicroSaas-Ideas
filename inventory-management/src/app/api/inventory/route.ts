import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const inventory = await prisma.inventory.findMany({
      where: locationId ? { locationId } : {},
      include: {
        product: {
          include: {
            category: true
          }
        },
        location: true,
        productVariant: true
      },
      take: limit,
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, locationId, quantity, cost } = body

    // Check if inventory record already exists
    const existingInventory = await prisma.inventory.findUnique({
      where: {
        productId_productVariantId_locationId: {
          productId,
          productVariantId: null,
          locationId
        }
      }
    })

    let inventory
    if (existingInventory) {
      // Update existing inventory
      inventory = await prisma.inventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: existingInventory.quantity + quantity,
          cost,
          updatedAt: new Date()
        },
        include: {
          product: true,
          location: true
        }
      })
    } else {
      // Create new inventory record
      inventory = await prisma.inventory.create({
        data: {
          productId,
          locationId,
          quantity,
          cost
        },
        include: {
          product: true,
          location: true
        }
      })
    }

    // Create stock movement record
    await prisma.stockMovement.create({
      data: {
        productId,
        locationId,
        type: 'IN',
        quantity,
        cost,
        reference: 'Manual Entry'
      }
    })

    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory' },
      { status: 500 }
    )
  }
}