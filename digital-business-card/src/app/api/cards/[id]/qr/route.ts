import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { QRCodeService } from '@/services/qr-service';
import { z } from 'zod';

const qrOptionsSchema = z.object({
  size: z.number().min(64).max(1024).default(256),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  color: z.object({
    dark: z.string().default('#000000'),
    light: z.string().default('#FFFFFF'),
  }).default({ dark: '#000000', light: '#FFFFFF' }),
  margin: z.number().min(0).max(10).default(1),
  type: z.enum(['vcard', 'url']).default('url'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const options = qrOptionsSchema.parse(Object.fromEntries(searchParams));

    // Get card data
    const card = await prisma.card.findUnique({
      where: { id: params.id },
      include: {
        fields: {
          where: { isVisible: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    let qrCodeDataURL: string;

    if (options.type === 'vcard') {
      // Generate vCard QR code
      const cardData = {
        name: card.fields.find(f => f.fieldType === 'name')?.value,
        title: card.fields.find(f => f.fieldType === 'title')?.value,
        company: card.fields.find(f => f.fieldType === 'company')?.value,
        phone: card.fields.find(f => f.fieldType === 'phone')?.value,
        email: card.fields.find(f => f.fieldType === 'email')?.value,
        website: card.fields.find(f => f.fieldType === 'website')?.value,
        address: card.fields.find(f => f.fieldType === 'address')?.value,
      };

      qrCodeDataURL = await QRCodeService.generateVCardQR(cardData, {
        size: options.size,
        errorCorrectionLevel: options.errorCorrectionLevel,
        color: options.color,
        margin: options.margin,
      });
    } else {
      // Generate URL QR code
      const cardURL = QRCodeService.generateCardURL(card.slug);
      qrCodeDataURL = await QRCodeService.generateQRCode(cardURL, {
        size: options.size,
        errorCorrectionLevel: options.errorCorrectionLevel,
        color: options.color,
        margin: options.margin,
      });
    }

    // Update card with QR code if it doesn't exist
    if (!card.qrCode) {
      await prisma.card.update({
        where: { id: params.id },
        data: { qrCode: qrCodeDataURL },
      });
    }

    return NextResponse.json({ qrCode: qrCodeDataURL });
  } catch (error) {
    console.error('Error generating QR code:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify card ownership
    const card = await prisma.card.findUnique({
      where: { id: params.id },
      select: { userId: true, slug: true },
    });

    if (!card || card.userId !== session.user.id) {
      return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const options = qrOptionsSchema.parse(body);

    // Generate new QR code
    let qrCodeDataURL: string;

    if (options.type === 'vcard') {
      // Get card fields for vCard
      const cardWithFields = await prisma.card.findUnique({
        where: { id: params.id },
        include: {
          fields: {
            where: { isVisible: true },
            orderBy: { order: 'asc' },
          },
        },
      });

      const cardData = {
        name: cardWithFields?.fields.find(f => f.fieldType === 'name')?.value,
        title: cardWithFields?.fields.find(f => f.fieldType === 'title')?.value,
        company: cardWithFields?.fields.find(f => f.fieldType === 'company')?.value,
        phone: cardWithFields?.fields.find(f => f.fieldType === 'phone')?.value,
        email: cardWithFields?.fields.find(f => f.fieldType === 'email')?.value,
        website: cardWithFields?.fields.find(f => f.fieldType === 'website')?.value,
        address: cardWithFields?.fields.find(f => f.fieldType === 'address')?.value,
      };

      qrCodeDataURL = await QRCodeService.generateVCardQR(cardData, {
        size: options.size,
        errorCorrectionLevel: options.errorCorrectionLevel,
        color: options.color,
        margin: options.margin,
      });
    } else {
      const cardURL = QRCodeService.generateCardURL(card.slug);
      qrCodeDataURL = await QRCodeService.generateQRCode(cardURL, {
        size: options.size,
        errorCorrectionLevel: options.errorCorrectionLevel,
        color: options.color,
        margin: options.margin,
      });
    }

    // Update card with new QR code
    await prisma.card.update({
      where: { id: params.id },
      data: { qrCode: qrCodeDataURL },
    });

    return NextResponse.json({ qrCode: qrCodeDataURL });
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}