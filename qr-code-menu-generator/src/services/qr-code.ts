import QRCode from 'qrcode'
import { generateShortUrl } from '@/lib/utils'

export interface QRCodeOptions {
  size?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  logo?: string
  style?: 'square' | 'rounded' | 'dots'
}

export interface QRCodeResult {
  dataUrl: string
  svg: string
  shortUrl: string
}

export class QRCodeService {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qrmenu.app'

  static async generateMenuQR(
    restaurantSlug: string,
    menuId: string,
    tableNumber?: string,
    options: QRCodeOptions = {}
  ): Promise<QRCodeResult> {
    // Generate short URL for the menu
    const shortCode = generateShortUrl()
    const shortUrl = `${this.BASE_URL}/m/${shortCode}`
    
    // Full menu URL
    const menuUrl = tableNumber 
      ? `${this.BASE_URL}/menu/${restaurantSlug}?table=${tableNumber}`
      : `${this.BASE_URL}/menu/${restaurantSlug}`

    // Default QR code options
    const qrOptions = {
      width: options.size || 300,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const,
    }

    try {
      // Generate data URL (base64 image)
      const dataUrl = await QRCode.toDataURL(shortUrl, qrOptions)
      
      // Generate SVG
      const svg = await QRCode.toString(shortUrl, {
        ...qrOptions,
        type: 'svg',
      })

      return {
        dataUrl,
        svg,
        shortUrl: shortCode,
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  static async generateCustomQR(
    url: string,
    options: QRCodeOptions = {}
  ): Promise<{ dataUrl: string; svg: string }> {
    const qrOptions = {
      width: options.size || 300,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const,
    }

    try {
      const dataUrl = await QRCode.toDataURL(url, qrOptions)
      const svg = await QRCode.toString(url, {
        ...qrOptions,
        type: 'svg',
      })

      return { dataUrl, svg }
    } catch (error) {
      console.error('Error generating custom QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  static async generateBatchQRCodes(
    restaurantSlug: string,
    menuId: string,
    tableNumbers: string[],
    options: QRCodeOptions = {}
  ): Promise<Array<QRCodeResult & { tableNumber: string }>> {
    const results = []

    for (const tableNumber of tableNumbers) {
      try {
        const qrResult = await this.generateMenuQR(
          restaurantSlug,
          menuId,
          tableNumber,
          options
        )
        
        results.push({
          ...qrResult,
          tableNumber,
        })
      } catch (error) {
        console.error(`Error generating QR for table ${tableNumber}:`, error)
        // Continue with other tables even if one fails
      }
    }

    return results
  }

  static getQRCodeUrl(shortCode: string): string {
    return `${this.BASE_URL}/m/${shortCode}`
  }

  static getMenuUrl(restaurantSlug: string, tableNumber?: string): string {
    const baseUrl = `${this.BASE_URL}/menu/${restaurantSlug}`
    return tableNumber ? `${baseUrl}?table=${tableNumber}` : baseUrl
  }

  static generateDownloadableQR(
    dataUrl: string,
    restaurantName: string,
    tableNumber?: string
  ): string {
    // Create a downloadable image with restaurant branding
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')

    canvas.width = 400
    canvas.height = 500

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Load and draw QR code
    const img = new Image()
    img.onload = () => {
      // Draw QR code in center
      const qrSize = 300
      const qrX = (canvas.width - qrSize) / 2
      const qrY = 50
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize)

      // Add restaurant name
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(restaurantName, canvas.width / 2, 380)

      // Add table number if provided
      if (tableNumber) {
        ctx.font = '18px Arial'
        ctx.fillText(`Table ${tableNumber}`, canvas.width / 2, 410)
      }

      // Add scan instruction
      ctx.font = '16px Arial'
      ctx.fillStyle = '#666666'
      ctx.fillText('Scan to view our digital menu', canvas.width / 2, 450)
    }
    
    img.src = dataUrl
    return canvas.toDataURL('image/png')
  }

  static validateQRCodeSize(size: number): boolean {
    return size >= 100 && size <= 1000
  }

  static validateErrorCorrectionLevel(level: string): boolean {
    return ['L', 'M', 'Q', 'H'].includes(level)
  }

  static estimateQRCapacity(data: string, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'): {
    canEncode: boolean
    maxCapacity: number
    currentLength: number
  } {
    // Approximate capacity limits for different error correction levels
    const capacities = {
      L: 2953, // Low
      M: 2331, // Medium
      Q: 1663, // Quartile
      H: 1273, // High
    }

    const maxCapacity = capacities[errorCorrectionLevel]
    const currentLength = data.length

    return {
      canEncode: currentLength <= maxCapacity,
      maxCapacity,
      currentLength,
    }
  }
}