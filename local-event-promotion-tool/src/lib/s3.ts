import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
  throw new Error('Missing AWS configuration environment variables')
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET
const CDN_URL = process.env.AWS_CLOUDFRONT_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`

// File upload functions
export async function uploadFile(
  key: string,
  file: Buffer | Uint8Array | string,
  contentType: string,
  metadata?: Record<string, string>
) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
      ServerSideEncryption: 'AES256',
    })

    const result = await s3Client.send(command)
    return {
      success: true,
      url: `${CDN_URL}/${key}`,
      key,
      etag: result.ETag,
    }
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    throw error
  }
}

export async function uploadEventImage(
  eventId: string,
  file: Buffer,
  fileName: string,
  contentType: string
) {
  const fileExtension = fileName.split('.').pop()
  const key = `events/${eventId}/images/${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${fileExtension}`
  
  return uploadFile(key, file, contentType, {
    eventId,
    uploadType: 'event-image',
    originalName: fileName,
  })
}

export async function uploadOrganizationLogo(
  organizationId: string,
  file: Buffer,
  fileName: string,
  contentType: string
) {
  const fileExtension = fileName.split('.').pop()
  const key = `organizations/${organizationId}/logo.${fileExtension}`
  
  return uploadFile(key, file, contentType, {
    organizationId,
    uploadType: 'organization-logo',
    originalName: fileName,
  })
}

export async function uploadUserAvatar(
  userId: string,
  file: Buffer,
  fileName: string,
  contentType: string
) {
  const fileExtension = fileName.split('.').pop()
  const key = `users/${userId}/avatar.${fileExtension}`
  
  return uploadFile(key, file, contentType, {
    userId,
    uploadType: 'user-avatar',
    originalName: fileName,
  })
}

// File deletion
export async function deleteFile(key: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    return { success: true }
  } catch (error) {
    console.error('Error deleting file from S3:', error)
    throw error
  }
}

// Generate presigned URLs for direct upload
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600 // 1 hour
) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    return {
      success: true,
      uploadUrl: signedUrl,
      key,
      publicUrl: `${CDN_URL}/${key}`,
    }
  } catch (error) {
    console.error('Error generating presigned upload URL:', error)
    throw error
  }
}

// Generate presigned URLs for download
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600 // 1 hour
) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    return {
      success: true,
      downloadUrl: signedUrl,
    }
  } catch (error) {
    console.error('Error generating presigned download URL:', error)
    throw error
  }
}

// Image processing and optimization
export function generateImageVariants(originalKey: string) {
  const basePath = originalKey.replace(/\.[^/.]+$/, '') // Remove extension
  const extension = originalKey.split('.').pop()
  
  return {
    thumbnail: `${basePath}-thumb.${extension}`,
    medium: `${basePath}-medium.${extension}`,
    large: `${basePath}-large.${extension}`,
    original: originalKey,
  }
}

// Utility functions
export function getPublicUrl(key: string) {
  return `${CDN_URL}/${key}`
}

export function extractKeyFromUrl(url: string) {
  if (url.includes(CDN_URL)) {
    return url.replace(`${CDN_URL}/`, '')
  }
  return url
}

export function validateImageFile(file: File) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
    }
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Please upload an image smaller than 10MB.',
    }
  }
  
  return { valid: true }
}

export function generateUploadKey(
  type: 'event-image' | 'organization-logo' | 'user-avatar' | 'document',
  entityId: string,
  fileName: string
) {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substr(2, 6)
  const fileExtension = fileName.split('.').pop()
  
  switch (type) {
    case 'event-image':
      return `events/${entityId}/images/${timestamp}-${randomId}.${fileExtension}`
    case 'organization-logo':
      return `organizations/${entityId}/logo.${fileExtension}`
    case 'user-avatar':
      return `users/${entityId}/avatar.${fileExtension}`
    case 'document':
      return `documents/${entityId}/${timestamp}-${randomId}.${fileExtension}`
    default:
      return `uploads/${timestamp}-${randomId}.${fileExtension}`
  }
}

// Batch operations
export async function uploadMultipleFiles(
  files: Array<{
    key: string
    file: Buffer
    contentType: string
    metadata?: Record<string, string>
  }>
) {
  try {
    const uploadPromises = files.map(({ key, file, contentType, metadata }) =>
      uploadFile(key, file, contentType, metadata)
    )
    
    const results = await Promise.all(uploadPromises)
    return {
      success: true,
      results,
    }
  } catch (error) {
    console.error('Error uploading multiple files:', error)
    throw error
  }
}

export async function deleteMultipleFiles(keys: string[]) {
  try {
    const deletePromises = keys.map(key => deleteFile(key))
    await Promise.all(deletePromises)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting multiple files:', error)
    throw error
  }
}

// File metadata and information
export async function getFileInfo(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    
    // Note: This would require additional AWS SDK calls to get metadata
    // For now, return basic info based on the key
    return {
      key,
      url: getPublicUrl(key),
      exists: true, // Would need actual S3 call to verify
    }
  } catch (error) {
    console.error('Error getting file info:', error)
    return {
      key,
      url: getPublicUrl(key),
      exists: false,
    }
  }
}

// Storage analytics
export function calculateStorageUsage(files: Array<{ size: number }>) {
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
  return {
    totalBytes,
    totalMB: Math.round(totalBytes / (1024 * 1024) * 100) / 100,
    totalGB: Math.round(totalBytes / (1024 * 1024 * 1024) * 100) / 100,
    fileCount: files.length,
  }
}

// Clean up old files (for scheduled tasks)
export async function cleanupOldFiles(olderThanDays: number) {
  // This would require listing objects and filtering by date
  // Implementation depends on specific cleanup requirements
  console.log(`Cleanup task for files older than ${olderThanDays} days`)
  // TODO: Implement cleanup logic
}