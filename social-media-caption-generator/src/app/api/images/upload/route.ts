import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeImage, generateImageSummary, categorizeImageContent, extractHashtagSuggestions } from '@/lib/vision';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check user subscription and limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user?.subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 402 }
      );
    }

    // Check upload limits based on plan
    const planLimits = {
      FREE: 10,
      CREATOR: 100,
      PROFESSIONAL: 500,
      AGENCY: 2000,
    };

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyUploads = await prisma.image.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: currentMonth },
      },
    });

    const limit = planLimits[user.subscription.plan];
    if (monthlyUploads >= limit) {
      return NextResponse.json(
        { error: `Monthly upload limit reached. Your ${user.subscription.plan} plan allows ${limit} uploads per month.` },
        { status: 402 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileId = randomUUID();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${fileId}.${extension}`;

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'images');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const { width, height, format } = metadata;

    // Create optimized versions
    const originalPath = join(uploadDir, filename);
    const optimizedFilename = `${fileId}_optimized.webp`;
    const optimizedPath = join(uploadDir, optimizedFilename);
    const thumbnailFilename = `${fileId}_thumb.webp`;
    const thumbnailPath = join(uploadDir, thumbnailFilename);

    // Save original
    await writeFile(originalPath, buffer);

    // Create optimized version (max 1200px width)
    await sharp(buffer)
      .resize(1200, null, { 
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: 85 })
      .toFile(optimizedPath);

    // Create thumbnail (300px width)
    await sharp(buffer)
      .resize(300, 300, { 
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);

    // Generate URLs
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const originalUrl = `${baseUrl}/uploads/images/${filename}`;
    const optimizedUrl = `${baseUrl}/uploads/images/${optimizedFilename}`;
    const thumbnailUrl = `${baseUrl}/uploads/images/${thumbnailFilename}`;

    // Analyze image with Google Vision
    let analysisResult;
    try {
      analysisResult = await analyzeImage(buffer);
    } catch (error) {
      console.error('Image analysis failed:', error);
      // Continue without analysis
      analysisResult = {
        objects: [],
        labels: [],
        text: '',
        faces: 0,
        colors: ['#000000'],
        landmarks: [],
        logos: [],
        safeSearch: {
          adult: 'UNKNOWN',
          spoof: 'UNKNOWN',
          medical: 'UNKNOWN',
          violence: 'UNKNOWN',
          racy: 'UNKNOWN',
        },
        imageProperties: { dominantColors: [] },
        confidence: 0,
        emotions: [],
      };
    }

    // Generate additional metadata
    const summary = generateImageSummary(analysisResult);
    const categorization = categorizeImageContent(analysisResult);
    const suggestedHashtags = extractHashtagSuggestions(analysisResult);

    // Check for inappropriate content
    const safeSearch = analysisResult.safeSearch;
    const isInappropriate = [
      safeSearch.adult,
      safeSearch.violence,
      safeSearch.racy,
    ].some(level => ['LIKELY', 'VERY_LIKELY'].includes(level));

    if (isInappropriate) {
      // Delete uploaded files
      const fs = require('fs').promises;
      await Promise.all([
        fs.unlink(originalPath).catch(() => {}),
        fs.unlink(optimizedPath).catch(() => {}),
        fs.unlink(thumbnailPath).catch(() => {}),
      ]);

      return NextResponse.json(
        { error: 'Image contains inappropriate content and cannot be uploaded.' },
        { status: 400 }
      );
    }

    // Save to database
    const image = await prisma.image.create({
      data: {
        userId: session.user.id,
        filename,
        originalUrl,
        optimizedUrl,
        thumbnailUrl,
        size: file.size,
        width: width || 0,
        height: height || 0,
        format: format || 'unknown',
        analysisData: {
          summary,
          categorization,
          suggestedHashtags,
          confidence: analysisResult.confidence,
          safeSearch: analysisResult.safeSearch,
          imageProperties: analysisResult.imageProperties,
          emotions: analysisResult.emotions,
          vision: analysisResult,
        },
        tags: analysisResult.labels.slice(0, 10),
        objects: analysisResult.objects.slice(0, 10),
        colors: analysisResult.colors,
        text: analysisResult.text || null,
        faces: analysisResult.faces || 0,
        metadata: {
          originalFilename: file.name,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          description,
        },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'IMAGE_UPLOADED',
        description: `Uploaded image: ${file.name}`,
        metadata: {
          imageId: image.id,
          filename: file.name,
          size: file.size,
          analysisConfidence: analysisResult.confidence,
          objectCount: analysisResult.objects.length,
        },
      },
    });

    // Update user analytics
    await prisma.userAnalytics.upsert({
      where: { userId: session.user.id },
      update: {
        lastActiveAt: new Date(),
      },
      create: {
        userId: session.user.id,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        image: {
          id: image.id,
          filename: image.filename,
          originalUrl: image.originalUrl,
          optimizedUrl: image.optimizedUrl,
          thumbnailUrl: image.thumbnailUrl,
          size: image.size,
          width: image.width,
          height: image.height,
          format: image.format,
          tags: image.tags,
          objects: image.objects,
          colors: image.colors,
          text: image.text,
          faces: image.faces,
          createdAt: image.createdAt,
        },
        analysis: {
          summary,
          categorization,
          suggestedHashtags,
          confidence: analysisResult.confidence,
          safeForWork: !isInappropriate,
        },
      },
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}