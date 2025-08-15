import { PrismaClient, EventCategory, SubscriptionPlan } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create event templates
  const templates = [
    {
      name: 'Business Networking Event',
      description: 'Professional networking event template',
      category: EventCategory.NETWORKING,
      template: {
        title: 'Monthly Business Networking',
        description: 'Join local business professionals for networking and collaboration opportunities.',
        duration: 180, // 3 hours
        capacity: 50,
        defaultTags: ['networking', 'business', 'professional'],
      },
      designSettings: {
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#f59e0b',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        layout: 'modern',
      },
      isPublic: true,
    },
    {
      name: 'Workshop Training',
      description: 'Educational workshop template',
      category: EventCategory.WORKSHOP,
      template: {
        title: 'Skills Development Workshop',
        description: 'Hands-on workshop to develop new skills and knowledge.',
        duration: 240, // 4 hours
        capacity: 25,
        defaultTags: ['workshop', 'training', 'education'],
      },
      designSettings: {
        colors: {
          primary: '#059669',
          secondary: '#6b7280',
          accent: '#f59e0b',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        layout: 'educational',
      },
      isPublic: true,
    },
    {
      name: 'Community Meetup',
      description: 'Casual community gathering template',
      category: EventCategory.MEETUP,
      template: {
        title: 'Community Meetup',
        description: 'Casual gathering for community members to connect and share ideas.',
        duration: 120, // 2 hours
        capacity: 30,
        defaultTags: ['community', 'meetup', 'social'],
      },
      designSettings: {
        colors: {
          primary: '#7c3aed',
          secondary: '#6b7280',
          accent: '#f59e0b',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        layout: 'casual',
      },
      isPublic: true,
    },
    {
      name: 'Product Launch',
      description: 'Product launch event template',
      category: EventCategory.BUSINESS,
      template: {
        title: 'Product Launch Event',
        description: 'Celebrate the launch of our new product with exclusive previews and demos.',
        duration: 150, // 2.5 hours
        capacity: 75,
        defaultTags: ['product-launch', 'business', 'demo'],
      },
      designSettings: {
        colors: {
          primary: '#dc2626',
          secondary: '#6b7280',
          accent: '#f59e0b',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        layout: 'corporate',
      },
      isPublic: true,
    },
    {
      name: 'Charity Fundraiser',
      description: 'Fundraising event template',
      category: EventCategory.CHARITY,
      template: {
        title: 'Charity Fundraiser',
        description: 'Support our cause and make a difference in the community.',
        duration: 240, // 4 hours
        capacity: 100,
        defaultTags: ['charity', 'fundraiser', 'community'],
      },
      designSettings: {
        colors: {
          primary: '#059669',
          secondary: '#6b7280',
          accent: '#f97316',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        layout: 'charity',
      },
      isPublic: true,
    },
  ]

  console.log('Creating event templates...')
  for (const template of templates) {
    await prisma.eventTemplate.upsert({
      where: { id: template.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: template.name.toLowerCase().replace(/\s+/g, '-'),
        ...template,
      },
    })
    console.log(`✅ Created template: ${template.name}`)
  }

  // Create demo organization (for development/testing)
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating demo organization...')
    
    const demoOrg = await prisma.organization.upsert({
      where: { slug: 'demo-events' },
      update: {},
      create: {
        name: 'Demo Events Co.',
        slug: 'demo-events',
        description: 'A demo organization for testing event promotion features',
        email: 'demo@eventpro.com',
        address: '123 Event Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        zipCode: '94105',
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: 'America/Los_Angeles',
        category: 'Event Management',
        businessType: 'Service',
        plan: SubscriptionPlan.PRO,
        settings: {
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
          branding: {
            primaryColor: '#2563eb',
            logo: null,
          },
          integrations: {
            googleAnalytics: null,
            facebookPixel: null,
          },
        },
        branding: {
          logo: null,
          colors: {
            primary: '#2563eb',
            secondary: '#64748b',
          },
          fonts: {
            heading: 'Inter',
            body: 'Inter',
          },
        },
      },
    })

    console.log(`✅ Created demo organization: ${demoOrg.name}`)

    // Create demo events
    const currentDate = new Date()
    const futureDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    
    const demoEvents = [
      {
        title: 'San Francisco Tech Networking',
        description: 'Connect with local tech professionals and entrepreneurs in the heart of San Francisco.',
        slug: 'sf-tech-networking-demo',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
        timezone: 'America/Los_Angeles',
        venue: 'The Tech Hub',
        address: '456 Tech Avenue',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        zipCode: '94105',
        latitude: 37.7849,
        longitude: -122.4094,
        category: EventCategory.NETWORKING,
        tags: ['tech', 'networking', 'entrepreneurs'],
        maxAttendees: 50,
        isPaid: true,
        currency: 'USD',
        organizationId: demoOrg.id,
        createdById: 'demo-user', // Will need to be updated with real user ID
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        metaTitle: 'San Francisco Tech Networking Event',
        metaDescription: 'Join the premier tech networking event in San Francisco',
        keywords: ['tech', 'networking', 'san francisco', 'entrepreneurs'],
      },
    ]

    // Note: Demo events creation is commented out as it requires a real user ID
    // This can be uncommented and modified when user authentication is set up
    
    console.log('✅ Demo data seeding preparation complete')
  }

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })