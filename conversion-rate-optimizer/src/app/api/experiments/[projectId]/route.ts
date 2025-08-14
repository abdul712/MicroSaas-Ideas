import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { abTestingEngine } from '@/lib/analytics/ab-testing-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get active experiments
    const experiments = await prisma.experiment.findMany({
      where: {
        projectId,
        status: 'RUNNING'
      },
      include: {
        variants: {
          orderBy: { trafficPercentage: 'desc' }
        }
      }
    });

    // Transform data for client consumption
    const clientExperiments = experiments.map(experiment => ({
      id: experiment.id,
      name: experiment.name,
      type: experiment.type,
      status: experiment.status,
      targetUrl: experiment.targetUrl,
      targetSelector: experiment.targetSelector,
      variants: experiment.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        isControl: variant.isControl,
        trafficPercentage: variant.trafficPercentage,
        changes: variant.changes as any[] // DOM modifications
      }))
    }));

    return NextResponse.json(clientExperiments);

  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await request.json();

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create new experiment
    const experiment = await prisma.experiment.create({
      data: {
        projectId,
        name: body.name,
        hypothesis: body.hypothesis,
        description: body.description,
        type: body.type || 'AB_TEST',
        status: 'DRAFT',
        trafficAllocation: body.trafficAllocation || {},
        targetUrl: body.targetUrl,
        targetSelector: body.targetSelector,
        confidenceLevel: body.confidenceLevel || 0.95,
        minimumDetectable: body.minimumDetectable || 0.05,
        statisticalMethod: body.statisticalMethod || 'FREQUENTIST',
        userId: body.userId, // Should come from authentication
        variants: {
          create: body.variants?.map((variant: any, index: number) => ({
            name: variant.name,
            description: variant.description,
            isControl: index === 0, // First variant is control
            trafficPercentage: variant.trafficPercentage || 50,
            changes: variant.changes || []
          })) || []
        }
      },
      include: {
        variants: true
      }
    });

    return NextResponse.json(experiment);

  } catch (error) {
    console.error('Error creating experiment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}