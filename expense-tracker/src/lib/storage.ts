import AWS from 'aws-sdk'
import fs from 'fs/promises'
import path from 'path'
import { createHash } from 'crypto'
import { prisma } from './prisma'

// AWS S3 configuration
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'expense-tracker-receipts'
const LOCAL_UPLOAD_PATH = process.env.LOCAL_UPLOAD_PATH || 'uploads/'

// Storage interface
export interface StorageConfig {
  useS3: boolean
  localPath?: string
  bucketName?: string
}

export class StorageService {
  private config: StorageConfig

  constructor() {
    this.config = {
      useS3: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      localPath: LOCAL_UPLOAD_PATH,
      bucketName: BUCKET_NAME,
    }
  }

  async upload(
    buffer: Buffer,
    key: string,
    contentType: string = 'application/octet-stream'
  ): Promise<string> {
    if (this.config.useS3) {
      return await this.uploadToS3(buffer, key, contentType)
    } else {
      return await this.uploadToLocal(buffer, key, contentType)
    }
  }

  private async uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    try {
      const uploadParams = {
        Bucket: this.config.bucketName!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ServerSideEncryption: 'AES256' as const,
        Metadata: {
          uploadedAt: new Date().toISOString(),
          size: buffer.length.toString(),
        },
      }

      const result = await s3.upload(uploadParams).promise()
      return result.Location
    } catch (error) {
      console.error('S3 upload failed:', error)
      // Fallback to local storage
      return await this.uploadToLocal(buffer, key, contentType)
    }
  }

  private async uploadToLocal(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    try {
      const localPath = path.join(this.config.localPath!, key)
      const directory = path.dirname(localPath)

      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true })

      // Write file
      await fs.writeFile(localPath, buffer)

      // Return local URL
      return `/uploads/${key}`
    } catch (error) {
      console.error('Local upload failed:', error)
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async delete(key: string): Promise<void> {
    if (this.config.useS3) {
      await this.deleteFromS3(key)
    } else {
      await this.deleteFromLocal(key)
    }
  }

  private async deleteFromS3(key: string): Promise<void> {
    try {
      await s3.deleteObject({
        Bucket: this.config.bucketName!,
        Key: key,
      }).promise()
    } catch (error) {
      console.error('S3 delete failed:', error)
      throw error
    }
  }

  private async deleteFromLocal(key: string): Promise<void> {
    try {
      const localPath = path.join(this.config.localPath!, key)
      await fs.unlink(localPath)
    } catch (error) {
      console.error('Local delete failed:', error)
      throw error
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.config.useS3) {
      return await this.getS3SignedUrl(key, expiresIn)
    } else {
      // For local files, return the direct URL
      return `/uploads/${key}`
    }
  }

  private async getS3SignedUrl(key: string, expiresIn: number): Promise<string> {
    try {
      return await s3.getSignedUrlPromise('getObject', {
        Bucket: this.config.bucketName!,
        Key: key,
        Expires: expiresIn,
      })
    } catch (error) {
      console.error('Failed to generate signed URL:', error)
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.config.useS3) {
      return await this.existsInS3(key)
    } else {
      return await this.existsInLocal(key)
    }
  }

  private async existsInS3(key: string): Promise<boolean> {
    try {
      await s3.headObject({
        Bucket: this.config.bucketName!,
        Key: key,
      }).promise()
      return true
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false
      }
      throw error
    }
  }

  private async existsInLocal(key: string): Promise<boolean> {
    try {
      const localPath = path.join(this.config.localPath!, key)
      await fs.access(localPath)
      return true
    } catch {
      return false
    }
  }

  generateKey(organizationId: string, userId: string, filename: string): string {
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const hash = createHash('md5').update(`${userId}-${Date.now()}`).digest('hex').slice(0, 8)
    const extension = path.extname(filename)
    const baseName = path.basename(filename, extension)
    
    return `${organizationId}/${userId}/${timestamp}/${hash}-${baseName}${extension}`
  }
}

// Global instance
export const storageService = new StorageService()

// Convenience functions
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType?: string
): Promise<string> {
  return await storageService.upload(buffer, key, contentType)
}

export async function deleteFromS3(key: string): Promise<void> {
  return await storageService.delete(key)
}

export async function getSignedUrl(key: string, expiresIn?: number): Promise<string> {
  return await storageService.getSignedUrl(key, expiresIn)
}

// File validation utilities
export interface FileValidationResult {
  isValid: boolean
  error?: string
  fileType?: string
  fileSize?: number
}

export function validateFile(
  buffer: Buffer,
  filename: string,
  options?: {
    maxSize?: number
    allowedTypes?: string[]
  }
): FileValidationResult {
  const maxSize = options?.maxSize || parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  const allowedTypes = options?.allowedTypes || (process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ])

  // Check file size
  if (buffer.length > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
      fileSize: buffer.length,
    }
  }

  // Detect file type from buffer (magic numbers)
  const fileType = detectFileType(buffer)
  
  if (!fileType) {
    return {
      isValid: false,
      error: 'Unable to determine file type',
      fileSize: buffer.length,
    }
  }

  // Check if file type is allowed
  if (!allowedTypes.includes(fileType)) {
    return {
      isValid: false,
      error: `File type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      fileType,
      fileSize: buffer.length,
    }
  }

  // Additional security checks
  if (containsMaliciousContent(buffer)) {
    return {
      isValid: false,
      error: 'File contains potentially malicious content',
      fileType,
      fileSize: buffer.length,
    }
  }

  return {
    isValid: true,
    fileType,
    fileSize: buffer.length,
  }
}

function detectFileType(buffer: Buffer): string | null {
  // Check magic numbers to detect file type
  const magicNumbers = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header (need to check WEBP after)
    'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  }

  for (const [mimeType, magic] of Object.entries(magicNumbers)) {
    if (magic.every((byte, index) => buffer[index] === byte)) {
      // Special case for WebP - need to check for WEBP signature
      if (mimeType === 'image/webp') {
        const webpSignature = Buffer.from('WEBP', 'ascii')
        const webpIndex = buffer.indexOf(webpSignature)
        if (webpIndex === 8) {
          return 'image/webp'
        }
      } else {
        return mimeType
      }
    }
  }

  return null
}

function containsMaliciousContent(buffer: Buffer): boolean {
  const text = buffer.toString('utf8', 0, Math.min(1024, buffer.length))
  
  // Check for common script injection patterns
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onload, etc.
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
  ]

  return maliciousPatterns.some(pattern => pattern.test(text))
}

// Utility to clean up old files
export async function cleanupOldFiles(olderThanDays: number = 30): Promise<void> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  try {
    // Find old receipts in database
    const oldReceipts = await prisma.receipt.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        // Only cleanup receipts that are not linked to expenses
        expenseId: null,
      },
      select: {
        id: true,
        fileUrl: true,
        thumbnailUrl: true,
      },
    })

    // Delete files and database records
    for (const receipt of oldReceipts) {
      try {
        // Extract key from URL
        const fileKey = receipt.fileUrl.replace(/^.*\/uploads\//, '')
        if (fileKey !== receipt.fileUrl) {
          await storageService.delete(fileKey)
        }

        if (receipt.thumbnailUrl) {
          const thumbKey = receipt.thumbnailUrl.replace(/^.*\/uploads\//, '')
          if (thumbKey !== receipt.thumbnailUrl) {
            await storageService.delete(thumbKey)
          }
        }

        // Delete database record
        await prisma.receipt.delete({
          where: { id: receipt.id },
        })
      } catch (error) {
        console.error(`Failed to cleanup receipt ${receipt.id}:`, error)
      }
    }

    console.log(`Cleaned up ${oldReceipts.length} old receipts`)
  } catch (error) {
    console.error('Failed to cleanup old files:', error)
  }
}

export default storageService