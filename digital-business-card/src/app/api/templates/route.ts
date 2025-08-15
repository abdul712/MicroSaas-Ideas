import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const premium = searchParams.get('premium');

    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (premium !== null) {
      where.premium = premium === 'true';
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [
        { premium: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // This would be admin-only in production
    const body = await request.json();
    
    const template = await prisma.template.create({
      data: {
        name: body.name,
        category: body.category,
        designJson: body.designJson,
        premium: body.premium || false,
        previewUrl: body.previewUrl,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}