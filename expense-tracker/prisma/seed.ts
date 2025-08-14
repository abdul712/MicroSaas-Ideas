import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create demo organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      name: 'Demo Corporation',
      slug: 'demo-corp',
      domain: 'demo-corp.com',
      subscriptionTier: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      maxUsers: 50,
      maxExpensesPerMonth: 1000,
      settings: {
        currency: 'USD',
        fiscalYearStart: '01-01',
        approvalRequired: true,
        autoCategorizationEnabled: true,
      },
    },
  })

  console.log('Created organization:', organization.name)

  // Create admin user
  const hashedPassword = await hash('AdminPassword123!', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo-corp.com' },
    update: {},
    create: {
      email: 'admin@demo-corp.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      hashedPassword,
      emailVerified: new Date(),
      organizationId: organization.id,
      preferences: {
        theme: 'system',
        notifications: true,
        currency: 'USD',
      },
    },
  })

  console.log('Created admin user:', adminUser.email)

  // Create demo user
  const demoUserPassword = await hash('DemoPassword123!', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'user@demo-corp.com' },
    update: {},
    create: {
      email: 'user@demo-corp.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'USER',
      hashedPassword: demoUserPassword,
      emailVerified: new Date(),
      organizationId: organization.id,
      preferences: {
        theme: 'light',
        notifications: true,
        currency: 'USD',
      },
    },
  })

  console.log('Created demo user:', demoUser.email)

  // Create default categories
  const defaultCategories = [
    { name: 'Travel & Transportation', color: '#3B82F6', icon: '✈️', taxDeductible: true },
    { name: 'Meals & Entertainment', color: '#EF4444', icon: '🍽️', taxDeductible: true },
    { name: 'Office Supplies', color: '#10B981', icon: '📎', taxDeductible: true },
    { name: 'Software & Subscriptions', color: '#8B5CF6', icon: '💻', taxDeductible: true },
    { name: 'Marketing & Advertising', color: '#F59E0B', icon: '📢', taxDeductible: true },
    { name: 'Professional Services', color: '#06B6D4', icon: '⚖️', taxDeductible: true },
    { name: 'Equipment & Hardware', color: '#84CC16', icon: '🖥️', taxDeductible: true },
    { name: 'Training & Education', color: '#EC4899', icon: '📚', taxDeductible: true },
    { name: 'Utilities & Internet', color: '#6366F1', icon: '⚡', taxDeductible: true },
    { name: 'Insurance', color: '#14B8A6', icon: '🛡️', taxDeductible: true },
    { name: 'Rent & Facilities', color: '#F97316', icon: '🏢', taxDeductible: true },
    { name: 'Other Business Expenses', color: '#6B7280', icon: '📋', taxDeductible: true },
  ]

  for (const categoryData of defaultCategories) {
    await prisma.category.upsert({
      where: {
        name_organizationId: {
          name: categoryData.name,
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        ...categoryData,
        organizationId: organization.id,
        isDefault: true,
      },
    })
  }

  console.log('Created default categories')

  // Create demo projects
  const projects = [
    {
      name: 'Website Redesign',
      description: 'Complete overhaul of company website',
      clientName: 'Internal',
      budget: 15000.00,
    },
    {
      name: 'Mobile App Development',
      description: 'Native mobile app for iOS and Android',
      clientName: 'TechCorp Inc.',
      budget: 50000.00,
    },
    {
      name: 'Marketing Campaign Q4',
      description: 'Holiday season marketing push',
      clientName: 'Internal',
      budget: 25000.00,
    },
  ]

  for (const projectData of projects) {
    await prisma.project.upsert({
      where: {
        id: 'temp-id-' + projectData.name.replace(/\s+/g, '-').toLowerCase(),
      },
      update: {},
      create: {
        ...projectData,
        organizationId: organization.id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
    })
  }

  console.log('Created demo projects')

  // Create demo budgets
  const budgets = [
    {
      name: 'Travel Budget 2024',
      amount: 10000.00,
      period: 'yearly',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      alertThreshold: 80,
    },
    {
      name: 'Office Supplies Monthly',
      amount: 500.00,
      period: 'monthly',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      alertThreshold: 90,
    },
  ]

  for (const budgetData of budgets) {
    await prisma.budget.create({
      data: {
        ...budgetData,
        organizationId: organization.id,
      },
    })
  }

  console.log('Created demo budgets')

  // Create sample expenses
  const travelCategory = await prisma.category.findFirst({
    where: { name: 'Travel & Transportation', organizationId: organization.id },
  })

  const mealsCategory = await prisma.category.findFirst({
    where: { name: 'Meals & Entertainment', organizationId: organization.id },
  })

  const websiteProject = await prisma.project.findFirst({
    where: { name: 'Website Redesign', organizationId: organization.id },
  })

  if (travelCategory && mealsCategory && websiteProject) {
    const expenses = [
      {
        amount: 450.00,
        description: 'Flight to client meeting',
        merchantName: 'Delta Airlines',
        expenseDate: new Date('2024-01-15'),
        categoryId: travelCategory.id,
        projectId: websiteProject.id,
        status: 'APPROVED',
        userId: demoUser.id,
      },
      {
        amount: 85.50,
        description: 'Business dinner with client',
        merchantName: 'The Steakhouse',
        expenseDate: new Date('2024-01-15'),
        categoryId: mealsCategory.id,
        projectId: websiteProject.id,
        status: 'APPROVED',
        userId: demoUser.id,
      },
      {
        amount: 25.00,
        description: 'Airport parking',
        merchantName: 'Airport Parking Services',
        expenseDate: new Date('2024-01-15'),
        categoryId: travelCategory.id,
        status: 'SUBMITTED',
        userId: demoUser.id,
      },
    ]

    for (const expenseData of expenses) {
      await prisma.expense.create({
        data: {
          ...expenseData,
          organizationId: organization.id,
          amountInBaseCurrency: expenseData.amount, // Assuming USD base currency
        },
      })
    }

    console.log('Created sample expenses')
  }

  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })