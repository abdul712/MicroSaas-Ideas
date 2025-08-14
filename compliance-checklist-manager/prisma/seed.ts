import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample organizations
  const demoOrg = await prisma.organization.upsert({
    where: { domain: 'demo.compliancemanager.com' },
    update: {},
    create: {
      name: 'Demo Healthcare Corp',
      domain: 'demo.compliancemanager.com',
      industry: 'Healthcare',
      subIndustry: 'Hospitals',
      size: 'Medium',
      location: 'United States',
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        complianceThreshold: 85,
        autoAssignTasks: true,
        notificationPreferences: {
          email: true,
          inApp: true,
          sms: false,
        },
      },
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.compliancemanager.com' },
    update: {},
    create: {
      email: 'admin@demo.compliancemanager.com',
      name: 'System Administrator',
      role: 'ORG_ADMIN',
      department: 'IT',
      permissions: [
        'manage_users',
        'manage_checklists',
        'manage_regulations',
        'view_reports',
        'manage_audits',
        'manage_documents',
        'manage_risks',
        'system_admin',
      ],
      hashedPassword,
      isActive: true,
      organizationId: demoOrg.id,
    },
  });

  // Create compliance manager user
  const complianceManagerPassword = await bcrypt.hash('compliance123', 10);
  const complianceManager = await prisma.user.upsert({
    where: { email: 'compliance@demo.compliancemanager.com' },
    update: {},
    create: {
      email: 'compliance@demo.compliancemanager.com',
      name: 'Jane Smith',
      role: 'COMPLIANCE_MANAGER',
      department: 'Compliance',
      permissions: [
        'manage_checklists',
        'view_regulations',
        'view_reports',
        'manage_audits',
        'manage_documents',
        'manage_risks',
      ],
      hashedPassword: complianceManagerPassword,
      isActive: true,
      organizationId: demoOrg.id,
    },
  });

  // Create sample regulations
  const hipaaRegulation = await prisma.regulation.upsert({
    where: { code: 'HIPAA' },
    update: {},
    create: {
      name: 'Health Insurance Portability and Accountability Act',
      code: 'HIPAA',
      authority: 'US Department of Health and Human Services',
      industry: ['Healthcare', 'Insurance'],
      jurisdiction: ['United States'],
      version: '2013',
      effectiveDate: new Date('2013-01-17'),
      description: 'Federal law that protects sensitive patient health information from being disclosed without patient consent or knowledge.',
      isActive: true,
    },
  });

  const gdprRegulation = await prisma.regulation.upsert({
    where: { code: 'GDPR' },
    update: {},
    create: {
      name: 'General Data Protection Regulation',
      code: 'GDPR',
      authority: 'European Union',
      industry: ['Technology', 'Healthcare', 'Financial', 'Retail'],
      jurisdiction: ['European Union'],
      version: '2018',
      effectiveDate: new Date('2018-05-25'),
      description: 'Regulation on data protection and privacy in the EU and EEA.',
      isActive: true,
    },
  });

  const soxRegulation = await prisma.regulation.upsert({
    where: { code: 'SOX' },
    update: {},
    create: {
      name: 'Sarbanes-Oxley Act',
      code: 'SOX',
      authority: 'Securities and Exchange Commission',
      industry: ['Financial', 'Public Companies'],
      jurisdiction: ['United States'],
      version: '2002',
      effectiveDate: new Date('2002-07-30'),
      description: 'Federal law that established new or enhanced standards for U.S. public company boards, management, and public accounting firms.',
      isActive: true,
    },
  });

  // Create sample requirements for HIPAA
  const hipaaRequirements = [
    {
      title: 'Administrative Safeguards - Security Officer',
      description: 'Assign security responsibilities to a security officer who is responsible for developing and implementing the policies and procedures required by the Security Rule.',
      frequency: 'ANNUAL' as const,
      priority: 'HIGH' as const,
      category: 'Administrative Safeguards',
      tags: ['security', 'administration', 'policies'],
      evidence: ['policy_document', 'job_description', 'training_records'],
    },
    {
      title: 'Physical Safeguards - Facility Access Controls',
      description: 'Implement policies and procedures to limit physical access to electronic information systems and the facility or facilities in which they are housed.',
      frequency: 'QUARTERLY' as const,
      priority: 'HIGH' as const,
      category: 'Physical Safeguards',
      tags: ['physical_security', 'access_control', 'facilities'],
      evidence: ['access_logs', 'security_assessment', 'policy_document'],
    },
    {
      title: 'Technical Safeguards - Access Control',
      description: 'Implement technical policies and procedures for electronic information systems that maintain electronic protected health information.',
      frequency: 'MONTHLY' as const,
      priority: 'CRITICAL' as const,
      category: 'Technical Safeguards',
      tags: ['technical', 'access_control', 'systems'],
      evidence: ['access_reports', 'system_logs', 'user_audit'],
    },
    {
      title: 'Breach Notification Procedures',
      description: 'Establish procedures for notifying individuals, HHS, and media of breaches of unsecured protected health information.',
      frequency: 'ANNUAL' as const,
      priority: 'CRITICAL' as const,
      category: 'Breach Response',
      tags: ['breach', 'notification', 'procedures'],
      evidence: ['procedure_document', 'notification_templates', 'training_records'],
    },
  ];

  for (const req of hipaaRequirements) {
    await prisma.requirement.upsert({
      where: {
        regulationId_title: {
          regulationId: hipaaRegulation.id,
          title: req.title,
        },
      },
      update: {},
      create: {
        ...req,
        regulationId: hipaaRegulation.id,
      },
    });
  }

  // Create sample requirements for GDPR
  const gdprRequirements = [
    {
      title: 'Data Protection Impact Assessment (DPIA)',
      description: 'Conduct a DPIA for processing operations likely to result in high risk to individuals.',
      frequency: 'ANNUAL' as const,
      priority: 'HIGH' as const,
      category: 'Privacy Assessment',
      tags: ['dpia', 'risk_assessment', 'privacy'],
      evidence: ['dpia_document', 'risk_assessment', 'approval_records'],
    },
    {
      title: 'Consent Management',
      description: 'Implement systems and procedures to obtain, record, and manage valid consent from data subjects.',
      frequency: 'QUARTERLY' as const,
      priority: 'CRITICAL' as const,
      category: 'Consent',
      tags: ['consent', 'data_subjects', 'records'],
      evidence: ['consent_records', 'system_logs', 'audit_trail'],
    },
  ];

  for (const req of gdprRequirements) {
    await prisma.requirement.upsert({
      where: {
        regulationId_title: {
          regulationId: gdprRegulation.id,
          title: req.title,
        },
      },
      update: {},
      create: {
        ...req,
        regulationId: gdprRegulation.id,
      },
    });
  }

  // Create sample checklist
  const sampleChecklist = await prisma.checklist.create({
    data: {
      title: 'Q1 2024 HIPAA Compliance Review',
      description: 'Quarterly review of HIPAA compliance requirements and controls.',
      status: 'ACTIVE',
      dueDate: new Date('2024-03-31'),
      startDate: new Date('2024-01-01'),
      isRecurring: true,
      frequency: 'QUARTERLY',
      nextDueDate: new Date('2024-06-30'),
      organizationId: demoOrg.id,
      regulationId: hipaaRegulation.id,
      createdById: adminUser.id,
      metadata: {
        priority: 'high',
        reviewType: 'quarterly',
        scope: 'organization-wide',
      },
    },
  });

  // Create sample checklist items
  const requirements = await prisma.requirement.findMany({
    where: { regulationId: hipaaRegulation.id },
  });

  for (const requirement of requirements) {
    await prisma.checklistItem.create({
      data: {
        title: requirement.title,
        description: requirement.description,
        status: 'PENDING',
        priority: requirement.priority,
        dueDate: new Date('2024-03-15'),
        checklistId: sampleChecklist.id,
        requirementId: requirement.id,
        assignedToId: complianceManager.id,
        metadata: {
          estimatedHours: 2,
          category: requirement.category,
        },
      },
    });
  }

  // Create sample compliance templates
  await prisma.template.upsert({
    where: {
      regulationId_name: {
        regulationId: hipaaRegulation.id,
        name: 'HIPAA Healthcare Template',
      },
    },
    update: {},
    create: {
      name: 'HIPAA Healthcare Template',
      description: 'Comprehensive HIPAA compliance template for healthcare organizations',
      industry: ['Healthcare'],
      category: 'Healthcare Compliance',
      version: '1.0',
      isPublic: true,
      regulationId: hipaaRegulation.id,
      structure: {
        sections: [
          {
            name: 'Administrative Safeguards',
            requirements: [
              'Security Officer Assignment',
              'Workforce Training',
              'Information Access Management',
              'Security Awareness and Training',
            ],
          },
          {
            name: 'Physical Safeguards',
            requirements: [
              'Facility Access Controls',
              'Workstation Use',
              'Device and Media Controls',
            ],
          },
          {
            name: 'Technical Safeguards',
            requirements: [
              'Access Control',
              'Audit Controls',
              'Integrity',
              'Person or Entity Authentication',
              'Transmission Security',
            ],
          },
        ],
      },
    },
  });

  // Create sample risk assessment
  await prisma.riskAssessment.create({
    data: {
      title: 'Data Breach Risk Assessment',
      description: 'Assessment of potential data breach risks and mitigation strategies.',
      riskLevel: 'HIGH',
      probability: 3,
      impact: 4,
      riskScore: 12.0,
      mitigation: 'Implement additional access controls, enhance monitoring, and conduct regular security training.',
      status: 'MITIGATING',
      reviewDate: new Date('2024-06-01'),
      organizationId: demoOrg.id,
      checklistId: sampleChecklist.id,
      assessedById: complianceManager.id,
    },
  });

  // Create sample audit
  const sampleAudit = await prisma.audit.create({
    data: {
      title: 'Annual HIPAA Compliance Audit',
      description: 'Comprehensive annual audit of HIPAA compliance program.',
      type: 'INTERNAL',
      status: 'PLANNED',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-04-15'),
      organizationId: demoOrg.id,
    },
  });

  // Create audit assignment
  await prisma.auditAssignment.create({
    data: {
      role: 'Lead Auditor',
      notes: 'Responsible for overall audit coordination and reporting.',
      auditId: sampleAudit.id,
      userId: complianceManager.id,
    },
  });

  // Create sample compliance score
  await prisma.complianceScore.create({
    data: {
      overallScore: 85.5,
      regulatoryScore: 90.0,
      processScore: 82.0,
      documentScore: 88.0,
      riskScore: 78.0,
      calculationDate: new Date(),
      organizationId: demoOrg.id,
      checklistId: sampleChecklist.id,
      scoreBreakdown: {
        administrative: 88,
        physical: 85,
        technical: 82,
        documentation: 90,
      },
      recommendations: [
        'Enhance technical safeguards implementation',
        'Update security awareness training program',
        'Review and update physical access controls',
      ],
    },
  });

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        title: 'Task Due Tomorrow',
        content: 'Your HIPAA compliance task "Access Control Review" is due tomorrow.',
        type: 'TASK_DUE',
        priority: 'HIGH',
        channels: ['email', 'in-app'],
        sentAt: new Date(),
        organizationId: demoOrg.id,
        userId: complianceManager.id,
        actionUrl: '/dashboard/tasks',
      },
      {
        title: 'Regulation Update Available',
        content: 'New HIPAA guidance has been published. Review the updated requirements.',
        type: 'REGULATION_UPDATE',
        priority: 'MEDIUM',
        channels: ['email', 'in-app'],
        sentAt: new Date(),
        organizationId: demoOrg.id,
        userId: complianceManager.id,
        actionUrl: '/regulations/HIPAA',
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📧 Admin login: admin@demo.compliancemanager.com / admin123`);
  console.log(`📧 Compliance Manager login: compliance@demo.compliancemanager.com / compliance123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });