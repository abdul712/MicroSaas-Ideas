import { PrismaClient, SubscriptionPlan, BrandVoiceType, Platform, AIProvider } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create feature flags
  const featureFlags = [
    {
      name: 'ANALYTICS_DASHBOARD',
      description: 'Enable advanced analytics dashboard',
      isEnabled: true,
      rolloutPercentage: 100,
    },
    {
      name: 'AI_COST_OPTIMIZATION',
      description: 'Enable AI cost optimization features',
      isEnabled: true,
      rolloutPercentage: 100,
    },
    {
      name: 'TEAM_COLLABORATION',
      description: 'Enable team collaboration features',
      isEnabled: true,
      rolloutPercentage: 100,
    },
    {
      name: 'WEBHOOK_SUPPORT',
      description: 'Enable webhook integrations',
      isEnabled: true,
      rolloutPercentage: 50,
    },
    {
      name: 'ADVANCED_BRAND_VOICE',
      description: 'Enable advanced brand voice training',
      isEnabled: true,
      rolloutPercentage: 100,
    },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: flag,
      create: flag,
    });
  }

  console.log('✅ Feature flags created');

  // Create demo admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@captiongenius.com' },
    update: {},
    create: {
      email: 'admin@captiongenius.com',
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      onboardingCompleted: true,
      subscription: {
        create: {
          plan: SubscriptionPlan.AGENCY,
          credits: 5000,
          maxCredits: 5000,
          creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      },
      analytics: {
        create: {
          totalCaptionsGenerated: 150,
          totalCreditsUsed: 450,
          averageGenerationTime: 2.3,
          platformUsage: {
            INSTAGRAM_FEED: 45,
            FACEBOOK_POST: 30,
            TWITTER_POST: 25,
            LINKEDIN_POST: 20,
            TIKTOK_POST: 15,
            INSTAGRAM_STORIES: 10,
            INSTAGRAM_REELS: 5,
          },
          peakUsageHours: [9, 10, 11, 14, 15, 16],
          favoriteFeatures: ['brand_voice', 'image_analysis', 'hashtag_suggestions'],
          lastActiveAt: new Date(),
          totalTimeSpent: 240, // 4 hours
        },
      },
    },
  });

  console.log('✅ Admin user created');

  // Create demo organization
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-agency' },
    update: {},
    create: {
      name: 'Demo Digital Agency',
      slug: 'demo-agency',
      description: 'A sample digital marketing agency using CaptionGenius',
      website: 'https://demo-agency.com',
      ownerId: adminUser.id,
      subscription: {
        create: {
          plan: SubscriptionPlan.AGENCY,
          credits: 5000,
          maxCredits: 5000,
          seats: 5,
          maxSeats: 5,
          creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      analytics: {
        create: {
          totalMembers: 3,
          activeMembers: 3,
          totalCaptionsGenerated: 500,
          totalCreditsUsed: 1200,
          averageEngagementRate: 4.2,
          topPerformingPlatforms: ['INSTAGRAM_FEED', 'TIKTOK_POST', 'LINKEDIN_POST'],
          monthlyCost: 149.0,
          costPerCaption: 0.298,
          monthlyGrowthRate: 15.5,
          retentionRate: 94.2,
        },
      },
    },
  });

  console.log('✅ Demo organization created');

  // Create sample brand voices
  const brandVoices = [
    {
      name: 'Professional & Authoritative',
      description: 'Expert tone for B2B content and thought leadership',
      type: BrandVoiceType.PROFESSIONAL,
      examples: [
        'Industry insights that drive real business transformation. 📊',
        'Leveraging data-driven strategies to maximize ROI and accelerate growth.',
        'Expert analysis: The key trends shaping the future of digital marketing.',
      ],
      keywords: ['expertise', 'insights', 'data-driven', 'strategic', 'professional'],
      toneGuidelines: 'Use professional language, include industry terminology, focus on expertise and credibility. Avoid casual language or overly promotional content.',
      organizationId: demoOrg.id,
    },
    {
      name: 'Friendly & Conversational',
      description: 'Warm, approachable tone for community engagement',
      type: BrandVoiceType.FRIENDLY,
      examples: [
        "Hey there! 👋 Just wanted to share something that made my day...",
        "Coffee chat vibes: Let's talk about what's really working in social media right now ☕",
        "Your questions inspire our best content! Keep them coming 💬",
      ],
      keywords: ['friendly', 'approachable', 'community', 'conversation', 'genuine'],
      toneGuidelines: 'Use conversational language, ask questions, encourage engagement. Include emojis naturally and create a sense of community.',
      organizationId: demoOrg.id,
    },
    {
      name: 'Inspirational & Motivational',
      description: 'Uplifting content that motivates and empowers',
      type: BrandVoiceType.INSPIRATIONAL,
      examples: [
        "Your potential is unlimited. Today is the perfect day to take that next step! 🚀",
        "Every expert was once a beginner. Every pro was once an amateur. ✨",
        "Success isn't about being perfect—it's about being persistent. Keep going! 💪",
      ],
      keywords: ['potential', 'growth', 'success', 'motivation', 'empowerment'],
      toneGuidelines: 'Focus on empowerment, use action-oriented language, include motivational quotes. Emphasize possibility and growth mindset.',
      organizationId: demoOrg.id,
    },
    {
      name: 'Casual & Humorous',
      description: 'Light-hearted, entertaining content with personality',
      type: BrandVoiceType.HUMOROUS,
      examples: [
        "POV: You're trying to explain social media ROI to your boss 😅",
        "Me: I'll just quickly check Instagram. Also me: *3 hours later* 🙃",
        "Social media managers: We put the 'fun' in 'dysfunctional content calendars' 📅",
      ],
      keywords: ['relatable', 'funny', 'casual', 'personality', 'entertainment'],
      toneGuidelines: 'Use humor appropriately, be relatable, include memes and trending references. Keep it light but professional.',
      organizationId: demoOrg.id,
    },
  ];

  for (const voice of brandVoices) {
    await prisma.brandVoice.upsert({
      where: { 
        id: voice.name.toLowerCase().replace(/[^a-z0-9]/g, '-') 
      },
      update: {},
      create: {
        id: voice.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ...voice,
      },
    });
  }

  console.log('✅ Brand voices created');

  // Create sample images
  const sampleImages = [
    {
      filename: 'product-launch.jpg',
      originalUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
      optimizedUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300',
      size: 245670,
      width: 1920,
      height: 1280,
      format: 'jpeg',
      tags: ['product', 'launch', 'technology', 'modern'],
      objects: ['laptop', 'workspace', 'coffee'],
      colors: ['#2563eb', '#f8fafc', '#1e293b'],
      text: 'Innovation',
      faces: 0,
      userId: adminUser.id,
    },
    {
      filename: 'team-meeting.jpg',
      originalUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf',
      optimizedUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300',
      size: 198432,
      width: 1920,
      height: 1280,
      format: 'jpeg',
      tags: ['team', 'meeting', 'collaboration', 'business'],
      objects: ['people', 'conference room', 'presentation'],
      colors: ['#3b82f6', '#ffffff', '#6b7280'],
      faces: 4,
      userId: adminUser.id,
    },
  ];

  for (const image of sampleImages) {
    await prisma.image.create({
      data: {
        ...image,
        analysisData: {
          confidence: 0.94,
          categories: image.tags,
          safeSearch: {
            adult: 'VERY_UNLIKELY',
            spoof: 'VERY_UNLIKELY',
            medical: 'UNLIKELY',
            violence: 'VERY_UNLIKELY',
            racy: 'UNLIKELY',
          },
        },
      },
    });
  }

  console.log('✅ Sample images created');

  // Create sample captions
  const sampleCaptions = [
    {
      originalPrompt: 'Create an engaging Instagram post about our new product launch',
      platform: Platform.INSTAGRAM_FEED,
      content: "🚀 The wait is over! We're thrilled to introduce our latest innovation that's about to change everything.\n\nAfter months of development and testing, we've created something truly special. This isn't just another product—it's a game-changer that will transform how you work.\n\n✨ What makes it different?\n• Cutting-edge technology\n• Intuitive design\n• Seamless integration\n• Unmatched performance\n\nReady to be part of the revolution? Link in bio to learn more! 👆\n\n#ProductLaunch #Innovation #Technology #GameChanger #Startup #TechNews",
      hashtags: ['ProductLaunch', 'Innovation', 'Technology', 'GameChanger', 'Startup', 'TechNews'],
      emojis: ['🚀', '✨', '👆'],
      aiProvider: AIProvider.OPENAI,
      modelUsed: 'gpt-4',
      generationStatus: 'COMPLETED',
      generationTime: 2340,
      cost: 0.15,
      qualityScore: 0.92,
      engagementPrediction: 4.7,
      brandVoiceMatch: 0.89,
      isFavorite: true,
      isUsed: true,
      usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      userId: adminUser.id,
      organizationId: demoOrg.id,
    },
    {
      originalPrompt: 'LinkedIn post about the importance of team collaboration',
      platform: Platform.LINKEDIN_POST,
      content: "The power of collaboration isn't just in bringing people together—it's in creating something greater than the sum of its parts.\n\nIn today's fast-paced business environment, the teams that thrive are those that:\n\n🤝 Foster open communication\n💡 Embrace diverse perspectives\n🎯 Align on shared goals\n📈 Continuously learn and adapt\n\nOur recent project exemplified this perfectly. What started as individual expertise evolved into collective brilliance, delivering results that exceeded all expectations.\n\nKey takeaway: When you invest in your team's collaborative culture, you're investing in your organization's future success.\n\nWhat strategies have you found most effective for building strong team collaboration? Share your insights below! 👇\n\n#Teamwork #Collaboration #Leadership #BusinessSuccess #ProfessionalDevelopment",
      hashtags: ['Teamwork', 'Collaboration', 'Leadership', 'BusinessSuccess', 'ProfessionalDevelopment'],
      emojis: ['🤝', '💡', '🎯', '📈', '👇'],
      aiProvider: AIProvider.ANTHROPIC,
      modelUsed: 'claude-3-haiku',
      generationStatus: 'COMPLETED',
      generationTime: 1890,
      cost: 0.08,
      qualityScore: 0.88,
      engagementPrediction: 5.2,
      brandVoiceMatch: 0.94,
      isFavorite: false,
      isUsed: true,
      usedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      userId: adminUser.id,
      organizationId: demoOrg.id,
    },
  ];

  for (const caption of sampleCaptions) {
    await prisma.caption.create({
      data: caption,
    });
  }

  console.log('✅ Sample captions created');

  // Create sample activities
  const activities = [
    {
      userId: adminUser.id,
      organizationId: demoOrg.id,
      type: 'CAPTION_GENERATED',
      description: 'Generated Instagram caption for product launch',
      metadata: { platform: 'INSTAGRAM_FEED', aiProvider: 'OPENAI' },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      userId: adminUser.id,
      organizationId: demoOrg.id,
      type: 'BRAND_VOICE_CREATED',
      description: 'Created new brand voice: Professional & Authoritative',
      metadata: { brandVoiceType: 'PROFESSIONAL' },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      userId: adminUser.id,
      type: 'SUBSCRIPTION_UPGRADED',
      description: 'Upgraded to Agency plan',
      metadata: { fromPlan: 'PROFESSIONAL', toPlan: 'AGENCY' },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
  ];

  for (const activity of activities) {
    await prisma.activity.create({
      data: activity,
    });
  }

  console.log('✅ Sample activities created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });