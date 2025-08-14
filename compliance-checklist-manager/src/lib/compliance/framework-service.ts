import { 
  ComplianceFramework, 
  ComplianceRequirement, 
  FRAMEWORK_TEMPLATES,
  RequirementFrequency,
  RequirementPriority,
  EvidenceType,
  ControlType,
  RiskLevel,
  INDUSTRIES,
  JURISDICTIONS
} from './types';

/**
 * Service for managing compliance frameworks and their requirements
 * Provides pre-built industry-specific compliance frameworks
 */
export class ComplianceFrameworkService {
  
  /**
   * Get all available compliance frameworks
   */
  static getAvailableFrameworks(): ComplianceFramework[] {
    return Object.values(FRAMEWORK_TEMPLATES).map(template => ({
      id: template.code.toLowerCase(),
      name: template.name,
      code: template.code,
      authority: template.authority,
      industry: template.industry,
      jurisdiction: template.jurisdiction,
      version: '1.0',
      effectiveDate: new Date(),
      isActive: true,
      requirements: this.getFrameworkRequirements(template.code),
    }));
  }

  /**
   * Get frameworks applicable to a specific industry
   */
  static getFrameworksByIndustry(industry: string): ComplianceFramework[] {
    return this.getAvailableFrameworks().filter(framework =>
      framework.industry.includes(industry)
    );
  }

  /**
   * Get frameworks applicable to a specific jurisdiction
   */
  static getFrameworksByJurisdiction(jurisdiction: string): ComplianceFramework[] {
    return this.getAvailableFrameworks().filter(framework =>
      framework.jurisdiction.includes(jurisdiction) ||
      framework.jurisdiction.includes(JURISDICTIONS.GLOBAL)
    );
  }

  /**
   * Get a specific framework by code
   */
  static getFrameworkByCode(code: string): ComplianceFramework | null {
    const framework = this.getAvailableFrameworks().find(f => f.code === code);
    return framework || null;
  }

  /**
   * Get requirements for a specific framework
   */
  static getFrameworkRequirements(frameworkCode: string): ComplianceRequirement[] {
    switch (frameworkCode) {
      case 'HIPAA':
        return this.getHIPAARequirements();
      case 'GDPR':
        return this.getGDPRRequirements();
      case 'SOX':
        return this.getSOXRequirements();
      case 'PCI-DSS':
        return this.getPCIDSSRequirements();
      case 'ISO-27001':
        return this.getISO27001Requirements();
      case 'SOC-2':
        return this.getSOC2Requirements();
      case 'CCPA':
        return this.getCCPARequirements();
      default:
        return [];
    }
  }

  /**
   * HIPAA (Health Insurance Portability and Accountability Act) Requirements
   */
  private static getHIPAARequirements(): ComplianceRequirement[] {
    return [
      {
        id: 'hipaa-admin-1',
        title: 'Security Officer Assignment',
        description: 'Assign security responsibilities to a security officer who is responsible for developing and implementing the policies and procedures required by the Security Rule.',
        category: 'Administrative Safeguards',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.HIGH,
        tags: ['security', 'administration', 'policies', 'officer'],
        evidenceTypes: [EvidenceType.POLICY_DOCUMENT, EvidenceType.TRAINING_RECORD],
        controlType: ControlType.DIRECTIVE,
        riskLevel: RiskLevel.HIGH,
        isActive: true,
        implementationGuidance: 'Designate a security officer and document their responsibilities in writing.',
      },
      {
        id: 'hipaa-admin-2',
        title: 'Workforce Training',
        description: 'Implement a security awareness and training program for all workforce members including management.',
        category: 'Administrative Safeguards',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.HIGH,
        tags: ['training', 'workforce', 'awareness', 'education'],
        evidenceTypes: [EvidenceType.TRAINING_RECORD, EvidenceType.CERTIFICATE],
        controlType: ControlType.PREVENTIVE,
        riskLevel: RiskLevel.MEDIUM,
        isActive: true,
        implementationGuidance: 'Conduct annual HIPAA training for all staff and maintain training records.',
      },
      {
        id: 'hipaa-physical-1',
        title: 'Facility Access Controls',
        description: 'Implement policies and procedures to limit physical access to electronic information systems and the facility or facilities in which they are housed.',
        category: 'Physical Safeguards',
        frequency: RequirementFrequency.QUARTERLY,
        priority: RequirementPriority.HIGH,
        tags: ['physical', 'access', 'facility', 'security'],
        evidenceTypes: [EvidenceType.POLICY_DOCUMENT, EvidenceType.LOG_FILE, EvidenceType.ASSESSMENT_REPORT],
        controlType: ControlType.PREVENTIVE,
        riskLevel: RiskLevel.HIGH,
        isActive: true,
        implementationGuidance: 'Implement keycard access, visitor logs, and regular access reviews.',
      },
      {
        id: 'hipaa-technical-1',
        title: 'Access Control',
        description: 'Implement technical policies and procedures for electronic information systems that maintain electronic protected health information.',
        category: 'Technical Safeguards',
        frequency: RequirementFrequency.MONTHLY,
        priority: RequirementPriority.CRITICAL,
        tags: ['technical', 'access', 'systems', 'phi'],
        evidenceTypes: [EvidenceType.SYSTEM_CONFIG, EvidenceType.LOG_FILE, EvidenceType.TEST_RESULTS],
        controlType: ControlType.PREVENTIVE,
        riskLevel: RiskLevel.CRITICAL,
        isActive: true,
        implementationGuidance: 'Implement user access controls, automatic logoff, and encryption.',
      },
      {
        id: 'hipaa-breach-1',
        title: 'Breach Notification Procedures',
        description: 'Establish procedures for notifying individuals, HHS, and media of breaches of unsecured protected health information.',
        category: 'Breach Response',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.CRITICAL,
        tags: ['breach', 'notification', 'procedures', 'response'],
        evidenceTypes: [EvidenceType.PROCEDURE_DOCUMENT, EvidenceType.INCIDENT_REPORT],
        controlType: ControlType.CORRECTIVE,
        riskLevel: RiskLevel.CRITICAL,
        isActive: true,
        implementationGuidance: 'Document breach response procedures and conduct regular drills.',
      },
    ];
  }

  /**
   * GDPR (General Data Protection Regulation) Requirements
   */
  private static getGDPRRequirements(): ComplianceRequirement[] {
    return [
      {
        id: 'gdpr-lawfulness-1',
        title: 'Lawful Basis for Processing',
        description: 'Establish and document the lawful basis for processing personal data.',
        category: 'Lawfulness of Processing',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.CRITICAL,
        tags: ['lawful', 'basis', 'processing', 'documentation'],
        evidenceTypes: [EvidenceType.POLICY_DOCUMENT, EvidenceType.PROCEDURE_DOCUMENT],
        controlType: ControlType.DIRECTIVE,
        riskLevel: RiskLevel.CRITICAL,
        isActive: true,
        implementationGuidance: 'Document the legal basis for each type of data processing activity.',
      },
      {
        id: 'gdpr-consent-1',
        title: 'Consent Management',
        description: 'Implement systems and procedures to obtain, record, and manage valid consent from data subjects.',
        category: 'Consent',
        frequency: RequirementFrequency.QUARTERLY,
        priority: RequirementPriority.HIGH,
        tags: ['consent', 'data', 'subjects', 'management'],
        evidenceTypes: [EvidenceType.SYSTEM_CONFIG, EvidenceType.LOG_FILE],
        controlType: ControlType.PREVENTIVE,
        riskLevel: RiskLevel.HIGH,
        isActive: true,
        implementationGuidance: 'Implement consent management tools and maintain audit trails.',
      },
      {
        id: 'gdpr-dpia-1',
        title: 'Data Protection Impact Assessment',
        description: 'Conduct a DPIA for processing operations likely to result in high risk to individuals.',
        category: 'Privacy Assessment',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.HIGH,
        tags: ['dpia', 'assessment', 'privacy', 'risk'],
        evidenceTypes: [EvidenceType.ASSESSMENT_REPORT, EvidenceType.PROCEDURE_DOCUMENT],
        controlType: ControlType.DETECTIVE,
        riskLevel: RiskLevel.HIGH,
        isActive: true,
        implementationGuidance: 'Complete DPIA template and obtain supervisory authority approval if required.',
      },
      {
        id: 'gdpr-rights-1',
        title: 'Data Subject Rights',
        description: 'Implement procedures to handle data subject requests for access, rectification, erasure, and portability.',
        category: 'Data Subject Rights',
        frequency: RequirementFrequency.MONTHLY,
        priority: RequirementPriority.HIGH,
        tags: ['rights', 'subjects', 'access', 'portability'],
        evidenceTypes: [EvidenceType.PROCEDURE_DOCUMENT, EvidenceType.LOG_FILE],
        controlType: ControlType.CORRECTIVE,
        riskLevel: RiskLevel.MEDIUM,
        isActive: true,
        implementationGuidance: 'Establish response procedures and track request fulfillment within 30 days.',
      },
    ];
  }

  /**
   * SOX (Sarbanes-Oxley Act) Requirements
   */
  private static getSOXRequirements(): ComplianceRequirement[] {
    return [
      {
        id: 'sox-302-1',
        title: 'CEO/CFO Certification',
        description: 'Chief Executive Officer and Chief Financial Officer must certify the accuracy of financial reports.',
        category: 'Management Certification',
        frequency: RequirementFrequency.QUARTERLY,
        priority: RequirementPriority.CRITICAL,
        tags: ['certification', 'ceo', 'cfo', 'financial'],
        evidenceTypes: [EvidenceType.CERTIFICATE, EvidenceType.PROCEDURE_DOCUMENT],
        controlType: ControlType.DETECTIVE,
        riskLevel: RiskLevel.CRITICAL,
        isActive: true,
        implementationGuidance: 'Establish certification process and maintain signed certifications.',
      },
      {
        id: 'sox-404-1',
        title: 'Internal Controls Assessment',
        description: 'Assess the effectiveness of internal controls over financial reporting.',
        category: 'Internal Controls',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.CRITICAL,
        tags: ['controls', 'assessment', 'financial', 'reporting'],
        evidenceTypes: [EvidenceType.ASSESSMENT_REPORT, EvidenceType.AUDIT_REPORT],
        controlType: ControlType.DETECTIVE,
        riskLevel: RiskLevel.CRITICAL,
        isActive: true,
        implementationGuidance: 'Conduct annual controls testing and document results.',
      },
      {
        id: 'sox-906-1',
        title: 'Code of Ethics',
        description: 'Establish a code of ethics for senior financial officers.',
        category: 'Ethics and Conduct',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.MEDIUM,
        tags: ['ethics', 'code', 'conduct', 'officers'],
        evidenceTypes: [EvidenceType.POLICY_DOCUMENT, EvidenceType.TRAINING_RECORD],
        controlType: ControlType.DIRECTIVE,
        riskLevel: RiskLevel.MEDIUM,
        isActive: true,
        implementationGuidance: 'Develop ethics code and provide annual training.',
      },
    ];
  }

  /**
   * PCI DSS (Payment Card Industry Data Security Standard) Requirements
   */
  private static getPCIDSSRequirements(): ComplianceRequirement[] {
    return [
      {
        id: 'pci-1-1',
        title: 'Firewall Configuration',
        description: 'Install and maintain a firewall configuration to protect cardholder data.',
        category: 'Network Security',
        frequency: RequirementFrequency.QUARTERLY,
        priority: RequirementPriority.CRITICAL,
        tags: ['firewall', 'network', 'security', 'cardholder'],
        evidenceTypes: [EvidenceType.SYSTEM_CONFIG, EvidenceType.TEST_RESULTS],
        controlType: ControlType.PREVENTIVE,
        riskLevel: RiskLevel.CRITICAL,
        isActive: true,
        implementationGuidance: 'Document firewall rules and conduct quarterly reviews.',
      },
      {
        id: 'pci-3-4',
        title: 'Cardholder Data Encryption',
        description: 'Render Primary Account Numbers (PAN) unreadable anywhere it is stored.',
        category: 'Data Protection',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.CRITICAL,
        tags: ['encryption', 'pan', 'cardholder', 'data'],
        evidenceTypes: [EvidenceType.SYSTEM_CONFIG, EvidenceType.TEST_RESULTS],
        controlType: ControlType.PREVENTIVE,
        riskLevel: RiskLevel.CRITICAL,
        isActive: true,
        implementationGuidance: 'Implement strong encryption and key management.',
      },
      {
        id: 'pci-11-2',
        title: 'Vulnerability Scanning',
        description: 'Run internal and external network vulnerability scans at least quarterly.',
        category: 'Security Testing',
        frequency: RequirementFrequency.QUARTERLY,
        priority: RequirementPriority.HIGH,
        tags: ['vulnerability', 'scanning', 'network', 'testing'],
        evidenceTypes: [EvidenceType.TEST_RESULTS, EvidenceType.ASSESSMENT_REPORT],
        controlType: ControlType.DETECTIVE,
        riskLevel: RiskLevel.HIGH,
        isActive: true,
        implementationGuidance: 'Use approved scanning vendors and remediate critical vulnerabilities.',
      },
    ];
  }

  /**
   * ISO 27001 (Information Security Management Systems) Requirements
   */
  private static getISO27001Requirements(): ComplianceRequirement[] {
    return [
      {
        id: 'iso27001-5-1',
        title: 'Information Security Policy',
        description: 'Establish, implement, and maintain an information security policy.',
        category: 'Information Security Policies',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.HIGH,
        tags: ['policy', 'security', 'management', 'governance'],
        evidenceTypes: [EvidenceType.POLICY_DOCUMENT, EvidenceType.PROCEDURE_DOCUMENT],
        controlType: ControlType.DIRECTIVE,
        riskLevel: RiskLevel.HIGH,
        isActive: true,
        implementationGuidance: 'Develop comprehensive security policy approved by management.',
      },
      {
        id: 'iso27001-9-1',
        title: 'Access Control Policy',
        description: 'Establish, implement, and maintain an access control policy.',
        category: 'Access Control',
        frequency: RequirementFrequency.QUARTERLY,
        priority: RequirementPriority.CRITICAL,
        tags: ['access', 'control', 'policy', 'authorization'],
        evidenceTypes: [EvidenceType.POLICY_DOCUMENT, EvidenceType.SYSTEM_CONFIG],
        controlType: ControlType.PREVENTIVE,
        riskLevel: RiskLevel.CRITICAL,
        isActive: true,
        implementationGuidance: 'Implement role-based access controls and regular reviews.',
      },
    ];
  }

  /**
   * SOC 2 (Service Organization Control 2) Requirements
   */
  private static getSOC2Requirements(): ComplianceRequirement[] {
    return [
      {
        id: 'soc2-cc1-1',
        title: 'Control Environment',
        description: 'Demonstrate commitment to integrity and ethical values.',
        category: 'Control Environment',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.HIGH,
        tags: ['control', 'environment', 'integrity', 'ethics'],
        evidenceTypes: [EvidenceType.POLICY_DOCUMENT, EvidenceType.TRAINING_RECORD],
        controlType: ControlType.DIRECTIVE,
        riskLevel: RiskLevel.MEDIUM,
        isActive: true,
        implementationGuidance: 'Establish code of conduct and ethics training program.',
      },
      {
        id: 'soc2-cc6-1',
        title: 'Logical and Physical Access Controls',
        description: 'Implement logical and physical access controls to prevent unauthorized access.',
        category: 'Logical and Physical Access Controls',
        frequency: RequirementFrequency.QUARTERLY,
        priority: RequirementPriority.CRITICAL,
        tags: ['access', 'controls', 'physical', 'logical'],
        evidenceTypes: [EvidenceType.SYSTEM_CONFIG, EvidenceType.LOG_FILE],
        controlType: ControlType.PREVENTIVE,
        riskLevel: RiskLevel.CRITICAL,
        isActive: true,
        implementationGuidance: 'Implement multi-factor authentication and physical security controls.',
      },
    ];
  }

  /**
   * CCPA (California Consumer Privacy Act) Requirements
   */
  private static getCCPARequirements(): ComplianceRequirement[] {
    return [
      {
        id: 'ccpa-notice-1',
        title: 'Privacy Notice',
        description: 'Provide consumers with notice about personal information collection and use.',
        category: 'Consumer Notice',
        frequency: RequirementFrequency.ANNUAL,
        priority: RequirementPriority.HIGH,
        tags: ['notice', 'privacy', 'consumer', 'disclosure'],
        evidenceTypes: [EvidenceType.POLICY_DOCUMENT, EvidenceType.PROCEDURE_DOCUMENT],
        controlType: ControlType.DIRECTIVE,
        riskLevel: RiskLevel.HIGH,
        isActive: true,
        implementationGuidance: 'Update privacy notice and ensure prominent placement on website.',
      },
      {
        id: 'ccpa-rights-1',
        title: 'Consumer Rights Implementation',
        description: 'Implement procedures to handle consumer requests for information disclosure, deletion, and opt-out.',
        category: 'Consumer Rights',
        frequency: RequirementFrequency.MONTHLY,
        priority: RequirementPriority.HIGH,
        tags: ['rights', 'consumer', 'disclosure', 'deletion'],
        evidenceTypes: [EvidenceType.PROCEDURE_DOCUMENT, EvidenceType.LOG_FILE],
        controlType: ControlType.CORRECTIVE,
        riskLevel: RiskLevel.HIGH,
        isActive: true,
        implementationGuidance: 'Establish request handling procedures and track response times.',
      },
    ];
  }

  /**
   * Get recommended frameworks for an organization
   */
  static getRecommendedFrameworks(industry: string, jurisdiction: string, size: string): ComplianceFramework[] {
    let frameworks = this.getFrameworksByIndustry(industry);
    
    // Filter by jurisdiction
    frameworks = frameworks.filter(f => 
      f.jurisdiction.includes(jurisdiction) || 
      f.jurisdiction.includes(JURISDICTIONS.GLOBAL)
    );

    // Add size-based recommendations
    if (size === 'Small' || size === 'Medium') {
      // Prioritize simpler frameworks for smaller organizations
      const priorityOrder = ['SOC-2', 'ISO-27001', 'GDPR', 'CCPA', 'HIPAA', 'PCI-DSS', 'SOX'];
      frameworks.sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.code);
        const bIndex = priorityOrder.indexOf(b.code);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
    }

    return frameworks;
  }

  /**
   * Create a custom framework
   */
  static createCustomFramework(
    name: string,
    code: string,
    authority: string,
    industry: string[],
    jurisdiction: string[],
    requirements: Omit<ComplianceRequirement, 'id'>[]
  ): ComplianceFramework {
    return {
      id: code.toLowerCase(),
      name,
      code,
      authority,
      industry,
      jurisdiction,
      version: '1.0',
      effectiveDate: new Date(),
      isActive: true,
      requirements: requirements.map((req, index) => ({
        ...req,
        id: `${code.toLowerCase()}-${index + 1}`,
      })),
    };
  }

  /**
   * Validate framework requirements
   */
  static validateFramework(framework: ComplianceFramework): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!framework.name || framework.name.trim().length === 0) {
      errors.push('Framework name is required');
    }

    if (!framework.code || framework.code.trim().length === 0) {
      errors.push('Framework code is required');
    }

    if (!framework.authority || framework.authority.trim().length === 0) {
      errors.push('Framework authority is required');
    }

    if (!framework.industry || framework.industry.length === 0) {
      errors.push('At least one industry must be specified');
    }

    if (!framework.jurisdiction || framework.jurisdiction.length === 0) {
      errors.push('At least one jurisdiction must be specified');
    }

    if (!framework.requirements || framework.requirements.length === 0) {
      errors.push('Framework must have at least one requirement');
    }

    // Validate requirements
    framework.requirements.forEach((req, index) => {
      if (!req.title || req.title.trim().length === 0) {
        errors.push(`Requirement ${index + 1}: Title is required`);
      }

      if (!req.description || req.description.trim().length === 0) {
        errors.push(`Requirement ${index + 1}: Description is required`);
      }

      if (!req.category || req.category.trim().length === 0) {
        errors.push(`Requirement ${index + 1}: Category is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}