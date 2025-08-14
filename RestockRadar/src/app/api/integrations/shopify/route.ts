import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const shopifyWebhookSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  title: z.string(),
  sku: z.string().optional(),
  inventory_quantity: z.number(),
  old_inventory_quantity: z.number().optional(),
  inventory_management: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

const connectShopifySchema = z.object({
  storeId: z.string(),
  shopifyDomain: z.string(),
  accessToken: z.string(),
  webhookUrl: z.string().optional(),
})

const syncInventorySchema = z.object({
  storeId: z.string(),
  productIds: z.array(z.string()).optional(),
  fullSync: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'webhook':
        return handleShopifyWebhook(request)
      case 'connect':
        return connectShopifyStore(request)
      case 'sync':
        return syncShopifyInventory(request)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use webhook, connect, or sync' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in Shopify integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleShopifyWebhook(request: NextRequest) {
  try {
    const body = await request.json()
    const webhookData = shopifyWebhookSchema.parse(body)

    // Extract store ID from webhook headers (configured during webhook setup)
    const storeId = request.headers.get('X-Store-ID')
    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID not found in webhook headers' },
        { status: 400 }
      )
    }

    // Verify webhook authenticity (in production, verify HMAC signature)
    const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256')
    if (!hmacHeader) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Find or create product
    let product = await prisma.product.findFirst({
      where: {
        storeId,
        externalId: webhookData.product_id.toString()
      }
    })

    if (!product) {
      // Create new product from Shopify data
      product = await prisma.product.create({
        data: {
          storeId,
          externalId: webhookData.product_id.toString(),
          title: webhookData.title,
          sku: webhookData.sku,
          currentStock: webhookData.inventory_quantity,
          lastSynced: new Date(),
        }
      })
    } else {
      // Update existing product
      const previousStock = product.currentStock
      const newStock = webhookData.inventory_quantity

      await prisma.product.update({
        where: { id: product.id },
        data: {
          title: webhookData.title,
          sku: webhookData.sku,
          currentStock: newStock,
          lastSynced: new Date(),
        }
      })

      // Create inventory log if stock changed
      if (previousStock !== newStock) {
        const quantity = Math.abs(newStock - previousStock)
        const type = newStock > previousStock ? 'PURCHASE' : 'SALE'

        await prisma.inventoryLog.create({
          data: {
            storeId,
            productId: product.id,
            type,
            quantity,
            previousStock,
            newStock,
            reason: 'Shopify sync'
          }
        })

        // Check for low stock alerts
        const reorderRule = await prisma.reorderRule.findUnique({
          where: {
            storeId_productId: {
              storeId,
              productId: product.id
            }
          }
        })

        if (reorderRule && newStock <= reorderRule.reorderPoint) {
          await prisma.notification.create({
            data: {
              storeId,
              productId: product.id,
              type: 'LOW_STOCK',
              title: 'Low Stock Alert - Shopify',
              message: `${product.title} is running low (${newStock} remaining) via Shopify sync`,
              priority: newStock === 0 ? 'URGENT' : 'HIGH',
              channels: ['IN_APP', 'EMAIL'],
            }
          })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      productId: product.id,
      previousStock: product.currentStock,
      newStock: webhookData.inventory_quantity
    })

  } catch (error) {
    console.error('Error handling Shopify webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function connectShopifyStore(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, shopifyDomain, accessToken, webhookUrl } = connectShopifySchema.parse(body)

    // Test Shopify API connection
    const shopifyApiUrl = `https://${shopifyDomain}/admin/api/2023-10/shop.json`
    const response = await fetch(shopifyApiUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Invalid Shopify credentials or domain' },
        { status: 400 }
      )
    }

    const shopData = await response.json()

    // Save integration
    const integration = await prisma.integration.upsert({
      where: {
        storeId_platform: {
          storeId,
          platform: 'SHOPIFY'
        }
      },
      update: {
        credentials: {
          domain: shopifyDomain,
          accessToken: accessToken, // In production, encrypt this
          webhookUrl,
          shopInfo: shopData.shop
        },
        isActive: true,
        lastSync: new Date(),
      },
      create: {
        storeId,
        platform: 'SHOPIFY',
        credentials: {
          domain: shopifyDomain,
          accessToken: accessToken, // In production, encrypt this
          webhookUrl,
          shopInfo: shopData.shop
        },
        isActive: true,
        lastSync: new Date(),
      }
    })

    // Set up webhooks for inventory updates
    if (webhookUrl) {
      const webhookData = {
        webhook: {
          topic: 'inventory_levels/update',
          address: webhookUrl,
          format: 'json'
        }
      }

      const webhookResponse = await fetch(
        `https://${shopifyDomain}/admin/api/2023-10/webhooks.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        }
      )

      if (webhookResponse.ok) {
        const webhook = await webhookResponse.json()
        console.log('Shopify webhook created:', webhook.webhook.id)
      }
    }

    return NextResponse.json({
      integration,
      shopInfo: shopData.shop,
      message: 'Shopify store connected successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error connecting Shopify store:', error)
    return NextResponse.json(
      { error: 'Failed to connect Shopify store' },
      { status: 500 }
    )
  }
}

async function syncShopifyInventory(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, productIds, fullSync } = syncInventorySchema.parse(body)

    // Get Shopify integration
    const integration = await prisma.integration.findUnique({
      where: {
        storeId_platform: {
          storeId,
          platform: 'SHOPIFY'
        }
      }
    })

    if (!integration || !integration.isActive) {
      return NextResponse.json(
        { error: 'Shopify integration not found or inactive' },
        { status: 404 }
      )
    }

    const credentials = integration.credentials as any
    const domain = credentials.domain
    const accessToken = credentials.accessToken

    let syncResults = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: 0
    }

    if (fullSync || !productIds) {
      // Full sync: fetch all products from Shopify
      let page = 1
      const limit = 50
      let hasMore = true

      while (hasMore) {
        const url = `https://${domain}/admin/api/2023-10/products.json?limit=${limit}&page=${page}`
        const response = await fetch(url, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          }
        })

        if (!response.ok) {
          throw new Error(`Shopify API error: ${response.statusText}`)
        }

        const data = await response.json()
        const products = data.products

        for (const shopifyProduct of products) {
          for (const variant of shopifyProduct.variants) {
            try {
              const result = await syncSingleProduct(storeId, shopifyProduct, variant)
              if (result === 'created') syncResults.created++
              else if (result === 'updated') syncResults.updated++
              syncResults.synced++
            } catch (error) {
              console.error('Error syncing product:', error)
              syncResults.errors++
            }
          }
        }

        hasMore = products.length === limit
        page++
      }
    } else {
      // Sync specific products
      for (const productId of productIds) {
        const product = await prisma.product.findUnique({
          where: { id: productId }
        })

        if (product && product.externalId) {
          try {
            const url = `https://${domain}/admin/api/2023-10/products/${product.externalId}.json`
            const response = await fetch(url, {
              headers: {
                'X-Shopify-Access-Token': accessToken,
              }
            })

            if (response.ok) {
              const data = await response.json()
              const shopifyProduct = data.product
              
              for (const variant of shopifyProduct.variants) {
                const result = await syncSingleProduct(storeId, shopifyProduct, variant)
                if (result === 'created') syncResults.created++
                else if (result === 'updated') syncResults.updated++
                syncResults.synced++
              }
            } else {
              syncResults.errors++
            }
          } catch (error) {
            console.error('Error syncing product:', error)
            syncResults.errors++
          }
        }
      }
    }

    // Update integration last sync time
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSync: new Date() }
    })

    return NextResponse.json({
      ...syncResults,
      message: `Sync completed: ${syncResults.synced} products processed`
    })

  } catch (error) {
    console.error('Error syncing Shopify inventory:', error)
    return NextResponse.json(
      { error: 'Failed to sync inventory' },
      { status: 500 }
    )
  }
}

async function syncSingleProduct(storeId: string, shopifyProduct: any, variant: any) {
  const existingProduct = await prisma.product.findFirst({
    where: {
      storeId,
      externalId: variant.id.toString()
    }
  })

  if (existingProduct) {
    // Update existing product
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        title: `${shopifyProduct.title} - ${variant.title}`,
        sku: variant.sku,
        currentStock: variant.inventory_quantity || 0,
        price: variant.price ? parseFloat(variant.price) : undefined,
        lastSynced: new Date(),
        variants: {
          shopifyVariantId: variant.id,
          shopifyProductId: shopifyProduct.id,
          title: variant.title,
          option1: variant.option1,
          option2: variant.option2,
          option3: variant.option3,
        }
      }
    })
    return 'updated'
  } else {
    // Create new product
    await prisma.product.create({
      data: {
        storeId,
        externalId: variant.id.toString(),
        title: `${shopifyProduct.title} - ${variant.title}`,
        description: shopifyProduct.body_html,
        sku: variant.sku,
        currentStock: variant.inventory_quantity || 0,
        price: variant.price ? parseFloat(variant.price) : undefined,
        lastSynced: new Date(),
        variants: {
          shopifyVariantId: variant.id,
          shopifyProductId: shopifyProduct.id,
          title: variant.title,
          option1: variant.option1,
          option2: variant.option2,
          option3: variant.option3,
        }
      }
    })
    return 'created'
  }
}