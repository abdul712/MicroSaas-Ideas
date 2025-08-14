import { createWorker } from 'tesseract.js'
import { prisma } from '@/lib/prisma'
import { uploadToS3 } from '@/lib/storage'
import sharp from 'sharp'

// Google Cloud Vision API types (if using Google Vision)
interface GoogleVisionResponse {
  responses: Array<{
    textAnnotations: Array<{
      description: string
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>
      }
    }>
    fullTextAnnotation?: {
      text: string
    }
  }>
}

// OCR result types
export interface OCRResult {
  text: string
  confidence: number
  extractedData: ExtractedReceiptData
  processingTime: number
}

export interface ExtractedReceiptData {
  amount?: number
  tax?: number
  date?: Date
  merchant?: string
  category?: string
  currency?: string
  confidence: {
    amount?: number
    tax?: number
    date?: number
    merchant?: number
    overall: number
  }
}

// Receipt processing service
export class ReceiptProcessor {
  private tesseractWorker: any = null

  async initialize() {
    if (!this.tesseractWorker) {
      this.tesseractWorker = await createWorker()
      await this.tesseractWorker.loadLanguage('eng')
      await this.tesseractWorker.initialize('eng')
      
      // Configure Tesseract for receipt processing
      await this.tesseractWorker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$/€£¥:-_()[]{}|&@#%+=*~ ',
        tessedit_pageseg_mode: '6', // Uniform block of text
      })
    }
  }

  async processReceipt(
    fileBuffer: Buffer,
    filename: string,
    userId: string,
    organizationId: string
  ): Promise<string> {
    const startTime = Date.now()

    try {
      // Preprocess image for better OCR accuracy
      const preprocessedImage = await this.preprocessImage(fileBuffer)

      // Create receipt record
      const receipt = await prisma.receipt.create({
        data: {
          filename,
          originalFilename: filename,
          fileSize: fileBuffer.length,
          mimeType: 'image/jpeg', // After preprocessing
          fileUrl: '', // Will be updated after upload
          ocrStatus: 'PROCESSING',
          userId,
          organizationId,
        },
      })

      // Upload to storage
      const fileUrl = await uploadToS3(
        preprocessedImage,
        `receipts/${organizationId}/${receipt.id}/${filename}`,
        'image/jpeg'
      )

      // Generate thumbnail
      const thumbnailBuffer = await sharp(preprocessedImage)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer()

      const thumbnailUrl = await uploadToS3(
        thumbnailBuffer,
        `receipts/${organizationId}/${receipt.id}/thumb_${filename}`,
        'image/jpeg'
      )

      // Perform OCR
      const ocrResult = await this.performOCR(preprocessedImage)
      
      // Extract structured data
      const extractedData = this.extractReceiptData(ocrResult.text)
      
      const processingTime = Date.now() - startTime

      // Update receipt with results
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          fileUrl,
          thumbnailUrl,
          ocrStatus: 'COMPLETED',
          ocrData: {
            rawText: ocrResult.text,
            confidence: ocrResult.confidence,
            processingMethod: 'tesseract',
          },
          extractedAmount: extractedData.amount,
          extractedDate: extractedData.date,
          extractedMerchant: extractedData.merchant,
          extractedTax: extractedData.tax,
          confidence: extractedData.confidence.overall / 100,
          processedAt: new Date(),
          processingTime,
        },
      })

      return receipt.id
    } catch (error) {
      console.error('Receipt processing failed:', error)
      throw new Error(`Receipt processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .greyscale() // Convert to grayscale for better OCR
        .normalize() // Normalize the image
        .sharpen() // Enhance edges
        .resize(null, 1200, { 
          withoutEnlargement: true,
          fit: 'inside'
        }) // Resize for optimal OCR
        .jpeg({ quality: 95 })
        .toBuffer()
    } catch (error) {
      console.error('Image preprocessing failed:', error)
      return buffer // Return original if preprocessing fails
    }
  }

  private async performOCR(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    await this.initialize()

    try {
      const result = await this.tesseractWorker.recognize(imageBuffer)
      
      return {
        text: result.data.text,
        confidence: result.data.confidence
      }
    } catch (error) {
      console.error('Tesseract OCR failed:', error)
      throw new Error('OCR processing failed')
    }
  }

  // Alternative: Google Cloud Vision API
  private async performGoogleVisionOCR(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('Google Cloud credentials not configured')
    }

    try {
      // Note: In a real implementation, you'd use the Google Cloud Vision client library
      // This is a simplified example
      const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getGoogleAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBuffer.toString('base64')
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1
                }
              ]
            }
          ]
        })
      })

      const result: GoogleVisionResponse = await response.json()
      const fullText = result.responses[0]?.fullTextAnnotation?.text || ''
      
      return {
        text: fullText,
        confidence: 95 // Google Vision typically has high confidence
      }
    } catch (error) {
      console.error('Google Vision OCR failed:', error)
      throw new Error('Google Vision OCR failed')
    }
  }

  private extractReceiptData(text: string): ExtractedReceiptData {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
    const result: ExtractedReceiptData = {
      confidence: { overall: 0 }
    }

    // Extract amount (look for currency symbols and decimal patterns)
    const amountPatterns = [
      /(?:total|amount|sum|price)?\s*\$?\s*(\d+\.?\d{0,2})\s*$/im,
      /\$\s*(\d+\.?\d{0,2})/g,
      /(\d+\.\d{2})\s*(?:$|usd|total)/i,
    ]

    let amountConfidence = 0
    for (const pattern of amountPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        const amount = parseFloat(matches[1] || matches[0].replace(/[^\d.]/g, ''))
        if (amount > 0 && amount < 10000) { // Reasonable range
          result.amount = amount
          amountConfidence = 80
          break
        }
      }
    }
    result.confidence.amount = amountConfidence

    // Extract date
    const datePatterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
      /(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
      /(\w{3,9}\s+\d{1,2},?\s+\d{2,4})/i, // "January 15, 2024"
    ]

    let dateConfidence = 0
    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match) {
        const parsedDate = new Date(match[1])
        if (!isNaN(parsedDate.getTime())) {
          result.date = parsedDate
          dateConfidence = 75
          break
        }
      }
    }
    result.confidence.date = dateConfidence

    // Extract merchant name (usually one of the first few lines)
    let merchantConfidence = 0
    const firstLines = lines.slice(0, 5)
    for (const line of firstLines) {
      if (line.length > 3 && line.length < 50 && /^[a-zA-Z\s&'-]+$/.test(line)) {
        result.merchant = line.trim()
        merchantConfidence = 60
        break
      }
    }
    result.confidence.merchant = merchantConfidence

    // Extract tax amount
    const taxPatterns = [
      /tax\s*:?\s*\$?\s*(\d+\.?\d{0,2})/i,
      /(\d+\.?\d{2})\s*tax/i,
    ]

    let taxConfidence = 0
    for (const pattern of taxPatterns) {
      const match = text.match(pattern)
      if (match) {
        const tax = parseFloat(match[1])
        if (tax > 0 && tax < (result.amount || 1000)) {
          result.tax = tax
          taxConfidence = 70
          break
        }
      }
    }
    result.confidence.tax = taxConfidence

    // Categorize based on merchant name
    if (result.merchant) {
      result.category = this.categorizeByMerchant(result.merchant)
    }

    // Calculate overall confidence
    const confidenceValues = Object.values(result.confidence).filter(c => typeof c === 'number' && c > 0)
    result.confidence.overall = confidenceValues.length > 0 
      ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length
      : 0

    return result
  }

  private categorizeByMerchant(merchant: string): string {
    const merchantLower = merchant.toLowerCase()
    
    const categories = {
      'Travel & Transportation': ['uber', 'lyft', 'taxi', 'airport', 'airline', 'hotel', 'parking'],
      'Meals & Entertainment': ['restaurant', 'cafe', 'coffee', 'bar', 'grill', 'bistro', 'diner', 'pizza'],
      'Office Supplies': ['office', 'staples', 'depot', 'supply'],
      'Software & Subscriptions': ['software', 'microsoft', 'adobe', 'google', 'saas'],
      'Utilities & Internet': ['electric', 'gas', 'internet', 'phone', 'utility'],
      'Equipment & Hardware': ['computer', 'laptop', 'monitor', 'equipment', 'hardware'],
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => merchantLower.includes(keyword))) {
        return category
      }
    }

    return 'Other Business Expenses'
  }

  private async getGoogleAccessToken(): Promise<string> {
    // In a real implementation, this would use Google Auth library
    // to get an access token from service account credentials
    throw new Error('Google access token generation not implemented')
  }

  async cleanup() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate()
      this.tesseractWorker = null
    }
  }
}

// Global instance
let receiptProcessor: ReceiptProcessor | null = null

export async function getReceiptProcessor(): Promise<ReceiptProcessor> {
  if (!receiptProcessor) {
    receiptProcessor = new ReceiptProcessor()
    await receiptProcessor.initialize()
  }
  return receiptProcessor
}

// Cleanup on process exit
process.on('exit', async () => {
  if (receiptProcessor) {
    await receiptProcessor.cleanup()
  }
})

export default ReceiptProcessor