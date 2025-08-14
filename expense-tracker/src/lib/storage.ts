import AWS from 'aws-sdk';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

interface UploadResult {
  url: string;
  thumbnailUrl?: string;
}

// AWS S3 Storage Provider
class S3StorageProvider {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.bucket = process.env.AWS_S3_BUCKET || 'expensetracker-receipts';
  }

  async upload(filename: string, buffer: Buffer, mimeType: string): Promise<UploadResult> {
    const key = `receipts/${filename}`;
    const thumbnailKey = `receipts/thumbnails/thumb_${filename}`;

    try {
      // Upload original file
      await this.s3.upload({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
        Metadata: {
          uploadedAt: new Date().toISOString(),
        },
      }).promise();

      // Create and upload thumbnail for images
      let thumbnailUrl: string | undefined;
      if (mimeType.startsWith('image/')) {
        try {
          const thumbnailBuffer = await sharp(buffer)
            .resize(300, 400, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer();

          await this.s3.upload({
            Bucket: this.bucket,
            Key: thumbnailKey,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
            ServerSideEncryption: 'AES256',
          }).promise();

          thumbnailUrl = `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${thumbnailKey}`;
        } catch (error) {
          console.warn('Failed to create thumbnail:', error);
        }
      }

      const url = `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

      return { url, thumbnailUrl };
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  async delete(filename: string): Promise<void> {
    const key = `receipts/${filename}`;
    const thumbnailKey = `receipts/thumbnails/thumb_${filename}`;

    try {
      // Delete original and thumbnail
      await Promise.all([
        this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise(),
        this.s3.deleteObject({ Bucket: this.bucket, Key: thumbnailKey }).promise(),
      ]);
    } catch (error) {
      console.error('S3 delete failed:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  async getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    const key = `receipts/${filename}`;
    
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresIn,
    });
  }
}

// Local File System Storage Provider (for development)
class LocalStorageProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    // Ensure upload directory exists
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'receipts'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'receipts', 'thumbnails'), { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directories:', error);
    }
  }

  async upload(filename: string, buffer: Buffer, mimeType: string): Promise<UploadResult> {
    const filePath = path.join(this.uploadDir, 'receipts', filename);
    const thumbnailPath = path.join(this.uploadDir, 'receipts', 'thumbnails', `thumb_${filename}`);

    try {
      // Save original file
      await fs.writeFile(filePath, buffer);

      // Create and save thumbnail for images
      let thumbnailUrl: string | undefined;
      if (mimeType.startsWith('image/')) {
        try {
          const thumbnailBuffer = await sharp(buffer)
            .resize(300, 400, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer();

          const thumbnailFilename = `thumb_${filename.replace(/\.[^/.]+$/, '.jpg')}`;
          const thumbnailFullPath = path.join(this.uploadDir, 'receipts', 'thumbnails', thumbnailFilename);
          
          await fs.writeFile(thumbnailFullPath, thumbnailBuffer);
          thumbnailUrl = `${this.baseUrl}/uploads/receipts/thumbnails/${thumbnailFilename}`;
        } catch (error) {
          console.warn('Failed to create thumbnail:', error);
        }
      }

      const url = `${this.baseUrl}/uploads/receipts/${filename}`;
      return { url, thumbnailUrl };
    } catch (error) {
      console.error('Local storage upload failed:', error);
      throw new Error('Failed to save file locally');
    }
  }

  async delete(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, 'receipts', filename);
    const thumbnailPath = path.join(this.uploadDir, 'receipts', 'thumbnails', `thumb_${filename}`);

    try {
      await Promise.all([
        fs.unlink(filePath).catch(() => {}), // Ignore if file doesn't exist
        fs.unlink(thumbnailPath).catch(() => {}),
      ]);
    } catch (error) {
      console.error('Local storage delete failed:', error);
      throw new Error('Failed to delete file locally');
    }
  }

  async getSignedUrl(filename: string): Promise<string> {
    // For local storage, return direct URL (no signing needed)
    return `${this.baseUrl}/uploads/receipts/${filename}`;
  }
}

// Storage factory
function createStorageProvider() {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  
  switch (provider) {
    case 's3':
      return new S3StorageProvider();
    case 'local':
    default:
      return new LocalStorageProvider();
  }
}

const storage = createStorageProvider();

// Main export functions
export async function uploadReceiptToStorage(
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<UploadResult> {
  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(mimeType)) {
    throw new Error('Invalid file type');
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (buffer.length > maxSize) {
    throw new Error('File too large');
  }

  // Security: Scan filename for directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Invalid filename');
  }

  return await storage.upload(filename, buffer, mimeType);
}

export async function deleteReceiptFromStorage(filename: string): Promise<void> {
  return await storage.delete(filename);
}

export async function getReceiptSignedUrl(
  filename: string,
  expiresIn: number = 3600
): Promise<string> {
  return await storage.getSignedUrl(filename, expiresIn);
}

// Image processing utilities
export async function optimizeImage(
  buffer: Buffer,
  options: {
    quality?: number;
    width?: number;
    height?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<Buffer> {
  const {
    quality = 85,
    width,
    height,
    format = 'jpeg',
  } = options;

  let processor = sharp(buffer);

  // Resize if dimensions provided
  if (width || height) {
    processor = processor.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert format and apply quality
  switch (format) {
    case 'jpeg':
      processor = processor.jpeg({ quality });
      break;
    case 'png':
      processor = processor.png({ quality });
      break;
    case 'webp':
      processor = processor.webp({ quality });
      break;
  }

  return await processor.toBuffer();
}

// File validation utilities
export function validateFileUpload(file: {
  size: number;
  type: string;
  name: string;
}): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size exceeds 10MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' };
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Invalid file extension' };
  }

  // Check for suspicious filenames
  if (file.name.includes('..') || /[<>:"/\\|?*]/.test(file.name)) {
    return { isValid: false, error: 'Invalid filename' };
  }

  return { isValid: true };
}

// Generate secure filename
export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50); // Limit length

  return `${timestamp}_${randomString}_${baseName}${extension}`;
}