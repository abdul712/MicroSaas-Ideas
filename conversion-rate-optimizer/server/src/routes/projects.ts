import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation rules
const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name is required and must be less than 255 characters'),
  body('domain')
    .isURL({ require_protocol: true })
    .withMessage('Valid domain URL is required'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry must be less than 100 characters'),
  body('monthlyTraffic')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Monthly traffic must be a positive integer'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string'),
];

const updateProjectValidation = [
  param('id').isString().withMessage('Project ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name must be less than 255 characters'),
  body('domain')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('Valid domain URL is required'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry must be less than 100 characters'),
  body('monthlyTraffic')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Monthly traffic must be a positive integer'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string'),
];

// Get all projects for the authenticated user
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 10, search, status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    userId: req.user!.id,
  };

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { domain: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tests: true,
            funnels: true,
            insights: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  res.json({
    projects,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
}));

// Get a specific project
router.get('/:id', 
  param('id').isString().withMessage('Project ID is required'),
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        funnels: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        tests: {
          where: { status: 'RUNNING' },
          include: {
            variations: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        insights: {
          where: { status: 'PENDING' },
          orderBy: { priority: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            tests: true,
            funnels: true,
            insights: true,
            events: true,
          },
        },
      },
    });

    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    res.json({ project });
  })
);

// Create a new project
router.post('/', createProjectValidation, asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { name, domain, industry, monthlyTraffic, timezone = 'UTC' } = req.body;

  // Check if user already has a project with this domain
  const existingProject = await prisma.project.findFirst({
    where: {
      userId: req.user!.id,
      domain,
    },
  });

  if (existingProject) {
    throw createError('Project with this domain already exists', 409, 'DOMAIN_EXISTS');
  }

  // Check subscription limits (placeholder - implement based on your pricing tiers)
  const userProjects = await prisma.project.count({
    where: { userId: req.user!.id },
  });

  // For now, limit to 10 projects per user
  if (userProjects >= 10) {
    throw createError('Project limit reached', 403, 'PROJECT_LIMIT_REACHED');
  }

  const project = await prisma.project.create({
    data: {
      userId: req.user!.id,
      name,
      domain,
      industry,
      monthlyTraffic,
      timezone,
      status: 'ACTIVE',
      trackingEnabled: true,
    },
    include: {
      _count: {
        select: {
          tests: true,
          funnels: true,
          insights: true,
        },
      },
    },
  });

  logger.info(`Project created: ${project.name} (${project.id}) by user ${req.user!.id}`);

  res.status(201).json({
    message: 'Project created successfully',
    project,
  });
}));

// Update a project
router.put('/:id', updateProjectValidation, asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if project exists and belongs to user
  const existingProject = await prisma.project.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  });

  if (!existingProject) {
    throw createError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  // If domain is being updated, check for duplicates
  if (updateData.domain && updateData.domain !== existingProject.domain) {
    const domainExists = await prisma.project.findFirst({
      where: {
        userId: req.user!.id,
        domain: updateData.domain,
        id: { not: id },
      },
    });

    if (domainExists) {
      throw createError('Project with this domain already exists', 409, 'DOMAIN_EXISTS');
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
    include: {
      _count: {
        select: {
          tests: true,
          funnels: true,
          insights: true,
        },
      },
    },
  });

  logger.info(`Project updated: ${project.name} (${project.id}) by user ${req.user!.id}`);

  res.json({
    message: 'Project updated successfully',
    project,
  });
}));

// Delete a project
router.delete('/:id',
  param('id').isString().withMessage('Project ID is required'),
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;

    // Check if project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // Check if there are any running tests
    const runningTests = await prisma.test.count({
      where: {
        projectId: id,
        status: 'RUNNING',
      },
    });

    if (runningTests > 0) {
      throw createError(
        'Cannot delete project with running tests. Please stop all tests first.',
        400,
        'RUNNING_TESTS_EXIST'
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    logger.info(`Project deleted: ${project.name} (${project.id}) by user ${req.user!.id}`);

    res.json({
      message: 'Project deleted successfully',
    });
  })
);

// Toggle project status
router.patch('/:id/status',
  param('id').isString().withMessage('Project ID is required'),
  body('status').isIn(['ACTIVE', 'PAUSED', 'ARCHIVED']).withMessage('Invalid status'),
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!existingProject) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // If pausing or archiving, stop all running tests
    if ((status === 'PAUSED' || status === 'ARCHIVED') && existingProject.status === 'ACTIVE') {
      await prisma.test.updateMany({
        where: {
          projectId: id,
          status: 'RUNNING',
        },
        data: {
          status: 'PAUSED',
          endedAt: new Date(),
        },
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: { status },
    });

    logger.info(`Project status changed: ${project.name} (${project.id}) to ${status} by user ${req.user!.id}`);

    res.json({
      message: 'Project status updated successfully',
      project,
    });
  })
);

// Get project analytics summary
router.get('/:id/analytics',
  param('id').isString().withMessage('Project ID is required'),
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid period'),
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { period = '30d' } = req.query;

    // Check if project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!project) {
      throw createError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get analytics data
    const [
      totalEvents,
      uniqueVisitors,
      conversions,
      testResults,
    ] = await Promise.all([
      prisma.event.count({
        where: {
          projectId: id,
          timestamp: { gte: startDate },
        },
      }),
      prisma.event.groupBy({
        by: ['sessionId'],
        where: {
          projectId: id,
          timestamp: { gte: startDate },
        },
        _count: { sessionId: true },
      }),
      prisma.conversion.count({
        where: {
          funnel: { projectId: id },
          timestamp: { gte: startDate },
        },
      }),
      prisma.test.findMany({
        where: {
          projectId: id,
          status: 'COMPLETED',
          endedAt: { gte: startDate },
        },
        include: {
          variations: true,
        },
      }),
    ]);

    const analytics = {
      totalEvents,
      uniqueVisitors: uniqueVisitors.length,
      conversions,
      conversionRate: uniqueVisitors.length > 0 ? (conversions / uniqueVisitors.length) * 100 : 0,
      completedTests: testResults.length,
      avgTestLift: testResults.length > 0 
        ? testResults.reduce((sum, test) => {
            const winningVariation = test.variations.find(v => v.isWinner);
            const controlVariation = test.variations.find(v => v.isControl);
            if (winningVariation && controlVariation && controlVariation.conversionRate) {
              const lift = ((winningVariation.conversionRate.toNumber() - controlVariation.conversionRate.toNumber()) / controlVariation.conversionRate.toNumber()) * 100;
              return sum + lift;
            }
            return sum;
          }, 0) / testResults.length
        : 0,
    };

    res.json({
      analytics,
      period,
    });
  })
);

export default router;