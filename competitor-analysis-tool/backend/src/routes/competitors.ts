import express from 'express'
import { body, query, param, validationResult } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import { createAuditLog } from '../services/audit-service'
import { scheduleCompetitorScraping } from '../services/scraping-service'
import { validateUrl } from '../utils/validators'

const router = express.Router()
const prisma = new PrismaClient()

// Validation rules
const createCompetitorValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Competitor name is required'),
  body('domain').trim().isLength({ min: 1 }).withMessage('Domain is required'),
  body('website').optional().custom(validateUrl).withMessage('Valid website URL is required'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('industry').optional().trim().isLength({ max: 100 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
]

const updateCompetitorValidation = [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Competitor name cannot be empty'),
  body('domain').optional().trim().isLength({ min: 1 }).withMessage('Domain cannot be empty'),
  body('website').optional().custom(validateUrl).withMessage('Valid website URL is required'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('industry').optional().trim().isLength({ max: 100 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('isActive').optional().isBoolean(),
]

// Routes
router.get('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId
    const {
      page = '1',
      limit = '10',
      search,
      industry,
      priority,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {
      organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { domain: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    if (industry) {
      where.industry = industry
    }

    if (priority) {
      where.priority = priority
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Get competitors with pagination
    const [competitors, total] = await Promise.all([
      prisma.competitor.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        include: {
          _count: {
            select: {
              monitoringRules: true,
              alerts: true,
              scrapedData: true,
            },
          },
          competitorTags: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.competitor.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        competitors,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    })

  } catch (error) {
    logger.error('Get competitors error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get competitors',
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const organizationId = req.user?.organizationId

    const competitor = await prisma.competitor.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        monitoringRules: {
          orderBy: { createdAt: 'desc' },
        },
        competitorTags: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            monitoringRules: true,
            scrapedData: true,
            alerts: true,
            priceHistory: true,
            socialMetrics: true,
            seoMetrics: true,
          },
        },
      },
    })

    if (!competitor) {
      return res.status(404).json({
        success: false,
        message: 'Competitor not found',
      })
    }

    res.json({
      success: true,
      data: { competitor },
    })

  } catch (error) {
    logger.error('Get competitor error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get competitor',
    })
  }
})

router.post('/', createCompetitorValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      })
    }

    const organizationId = req.user?.organizationId!
    const userId = req.user?.id!
    const { name, domain, website, description, industry, priority = 'medium' } = req.body

    // Check if competitor with same domain already exists in organization
    const existingCompetitor = await prisma.competitor.findFirst({
      where: {
        organizationId,
        domain,
      },
    })

    if (existingCompetitor) {
      return res.status(409).json({
        success: false,
        message: 'Competitor with this domain already exists',
      })
    }

    // Create competitor
    const competitor = await prisma.competitor.create({
      data: {
        name,
        domain,
        website,
        description,
        industry,
        priority,
        organizationId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            monitoringRules: true,
            scrapedData: true,
            alerts: true,
          },
        },
      },
    })

    // Create audit log
    await createAuditLog({
      organizationId,
      userId,
      action: 'create',
      resource: 'competitor',
      resourceId: competitor.id,
      newValues: { name, domain, website, description, industry, priority },
    })

    // Schedule initial scraping (async)
    scheduleCompetitorScraping(competitor.id).catch(error => {
      logger.error(`Failed to schedule scraping for competitor ${competitor.id}:`, error)
    })

    logger.info(`Competitor created: ${name} (${domain}) by user ${userId}`)

    res.status(201).json({
      success: true,
      message: 'Competitor created successfully',
      data: { competitor },
    })

  } catch (error) {
    logger.error('Create competitor error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create competitor',
    })
  }
})

router.put('/:id', updateCompetitorValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      })
    }

    const { id } = req.params
    const organizationId = req.user?.organizationId!
    const userId = req.user?.id!

    // Check if competitor exists and belongs to organization
    const existingCompetitor = await prisma.competitor.findFirst({
      where: {
        id,
        organizationId,
      },
    })

    if (!existingCompetitor) {
      return res.status(404).json({
        success: false,
        message: 'Competitor not found',
      })
    }

    // Check if domain is being changed and if it conflicts
    if (req.body.domain && req.body.domain !== existingCompetitor.domain) {
      const domainConflict = await prisma.competitor.findFirst({
        where: {
          organizationId,
          domain: req.body.domain,
          id: { not: id },
        },
      })

      if (domainConflict) {
        return res.status(409).json({
          success: false,
          message: 'Another competitor with this domain already exists',
        })
      }
    }

    // Update competitor
    const competitor = await prisma.competitor.update({
      where: { id },
      data: {
        ...req.body,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            monitoringRules: true,
            scrapedData: true,
            alerts: true,
          },
        },
      },
    })

    // Create audit log
    await createAuditLog({
      organizationId,
      userId,
      action: 'update',
      resource: 'competitor',
      resourceId: id,
      oldValues: existingCompetitor,
      newValues: req.body,
    })

    logger.info(`Competitor updated: ${id} by user ${userId}`)

    res.json({
      success: true,
      message: 'Competitor updated successfully',
      data: { competitor },
    })

  } catch (error) {
    logger.error('Update competitor error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update competitor',
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const organizationId = req.user?.organizationId!
    const userId = req.user?.id!

    // Check if competitor exists and belongs to organization
    const existingCompetitor = await prisma.competitor.findFirst({
      where: {
        id,
        organizationId,
      },
    })

    if (!existingCompetitor) {
      return res.status(404).json({
        success: false,
        message: 'Competitor not found',
      })
    }

    // Delete competitor (cascade will handle related data)
    await prisma.competitor.delete({
      where: { id },
    })

    // Create audit log
    await createAuditLog({
      organizationId,
      userId,
      action: 'delete',
      resource: 'competitor',
      resourceId: id,
      oldValues: existingCompetitor,
    })

    logger.info(`Competitor deleted: ${id} by user ${userId}`)

    res.json({
      success: true,
      message: 'Competitor deleted successfully',
    })

  } catch (error) {
    logger.error('Delete competitor error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete competitor',
    })
  }
})

// Bulk operations
router.post('/bulk', async (req, res) => {
  try {
    const { action, competitorIds } = req.body
    const organizationId = req.user?.organizationId!
    const userId = req.user?.id!

    if (!action || !competitorIds || !Array.isArray(competitorIds)) {
      return res.status(400).json({
        success: false,
        message: 'Action and competitor IDs are required',
      })
    }

    let result
    switch (action) {
      case 'delete':
        result = await prisma.competitor.deleteMany({
          where: {
            id: { in: competitorIds },
            organizationId,
          },
        })
        break

      case 'activate':
        result = await prisma.competitor.updateMany({
          where: {
            id: { in: competitorIds },
            organizationId,
          },
          data: { isActive: true },
        })
        break

      case 'deactivate':
        result = await prisma.competitor.updateMany({
          where: {
            id: { in: competitorIds },
            organizationId,
          },
          data: { isActive: false },
        })
        break

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action',
        })
    }

    // Create audit log
    await createAuditLog({
      organizationId,
      userId,
      action: 'update',
      resource: 'competitor_bulk',
      newValues: { action, competitorIds, count: result.count },
    })

    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      data: { count: result.count },
    })

  } catch (error) {
    logger.error('Bulk competitors operation error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk operation',
    })
  }
})

export default router