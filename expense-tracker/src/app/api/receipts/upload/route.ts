import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { processReceiptOCR } from '@/lib/ocr';
import { uploadReceiptToStorage } from '@/lib/storage';
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// POST /api/receipts/upload - Upload and process receipt
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const expenseId = formData.get('expenseId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.' },
        { status: 400 }
      );
    }

    // Verify expense exists if provided
    if (expenseId) {
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          userId: session.user.id,
          ...(session.user.organizationId && { organizationId: session.user.organizationId }),
        },
      });

      if (!expense) {
        return NextResponse.json(
          { error: 'Expense not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    const filename = `receipt_${timestamp}_${randomString}.${extension}`;

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to storage (S3 or local)
    const { url, thumbnailUrl } = await uploadReceiptToStorage(filename, buffer, file.type);

    // Create receipt record
    const receipt = await prisma.receipt.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        url,
        thumbnailUrl,
        expenseId,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        ocrStatus: 'PENDING',
      },
    });

    // Start OCR processing asynchronously
    processReceiptOCR(receipt.id, url, file.type)
      .then(async (ocrResult) => {
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: {
            ocrStatus: 'COMPLETED',
            ocrData: ocrResult.rawData,
            ocrConfidence: ocrResult.confidence,
            ocrProcessedAt: new Date(),
            extractedAmount: ocrResult.extractedData?.amount,
            extractedDate: ocrResult.extractedData?.date,
            extractedMerchant: ocrResult.extractedData?.merchant,
            extractedItems: ocrResult.extractedData?.items,
          },
        });

        // If no expense is linked and we have good OCR data, suggest creating one
        if (!expenseId && ocrResult.extractedData?.amount && ocrResult.confidence > 0.8) {
          // Could trigger a notification or webhook here
          console.log('OCR completed with high confidence, suggest creating expense');
        }
      })
      .catch(async (error) => {
        console.error('OCR processing failed:', error);
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: {
            ocrStatus: 'FAILED',
            ocrProcessedAt: new Date(),
          },
        });
      });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPLOAD',
        entityType: 'Receipt',
        entityId: receipt.id,
        newValues: {
          filename: receipt.filename,
          fileSize: receipt.fileSize,
          mimeType: receipt.mimeType,
        },
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
    });

    const response = {
      id: receipt.id,
      filename: receipt.filename,
      originalName: receipt.originalName,
      url: receipt.url,
      thumbnailUrl: receipt.thumbnailUrl,
      fileSize: receipt.fileSize,
      ocrStatus: receipt.ocrStatus,
      createdAt: receipt.createdAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/receipts/upload - Get upload status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const receiptId = searchParams.get('receiptId');

    if (!receiptId) {
      return NextResponse.json({ error: 'Receipt ID required' }, { status: 400 });
    }

    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        userId: session.user.id,
        ...(session.user.organizationId && { organizationId: session.user.organizationId }),
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        ocrStatus: true,
        ocrConfidence: true,
        ocrProcessedAt: true,
        extractedAmount: true,
        extractedDate: true,
        extractedMerchant: true,
        extractedItems: true,
        isValidated: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}