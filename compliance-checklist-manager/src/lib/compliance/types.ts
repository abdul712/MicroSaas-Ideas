// Core compliance framework types

export interface ComplianceFramework {
  id: string;
  name: string;
  code: string;
  authority: string;
  industry: string[];
  jurisdiction: string[];
  version: string;
  effectiveDate: Date;
  description?: string;
  isActive: boolean;
  requirements: ComplianceRequirement[];
  metadata?: Record<string, any>;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  frequency: RequirementFrequency;
  priority: RequirementPriority;
  tags: string[];
  evidenceTypes: EvidenceType[];
  controlType: ControlType;
  implementationGuidance?: string;
  riskLevel: RiskLevel;
  dependencies?: string[]; // Other requirement IDs
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface ComplianceControl {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  controlType: ControlType;
  implementationStatus: ImplementationStatus;
  testingFrequency: RequirementFrequency;
  lastTested?: Date;
  nextTestDate?: Date;
  effectiveness: ControlEffectiveness;
  evidence: Evidence[];
  issues: ControlIssue[];
  metadata?: Record<string, any>;
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
  uploadedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface ControlIssue {
  id: string;
  controlId: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  identifiedDate: Date;
  dueDate?: Date;
  resolvedDate?: Date;
  assignedTo?: string;
  resolution?: string;
  metadata?: Record<string, any>;
}

export interface ComplianceAssessment {
  id: string;
  organizationId: string;
  frameworkId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status: AssessmentStatus;
  scope: AssessmentScope;
  assessors: string[];
  findings: AssessmentFinding[];
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  recommendations: string[];
  metadata?: Record<string, any>;
}

export interface AssessmentFinding {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  evidence?: string[];
  recommendations?: string[];
  dueDate?: Date;
  assignedTo?: string;
  metadata?: Record<string, any>;
}

export interface ScoreBreakdown {
  categories: CategoryScore[];
  risks: RiskScore[];
  trends: ScoreTrend[];
}

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  requirements: RequirementScore[];
}

export interface RequirementScore {
  requirementId: string;
  score: number;
  maxScore: number;
  status: ComplianceStatus;
  lastUpdated: Date;
}

export interface RiskScore {
  riskLevel: RiskLevel;
  count: number;
  percentage: number;
}

export interface ScoreTrend {
  date: Date;
  score: number;
  category?: string;
}

// Enums and constants

export enum RequirementFrequency {
  CONTINUOUS = 'CONTINUOUS',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL',
  BIENNIAL = 'BIENNIAL',
  TRIENNIAL = 'TRIENNIAL',
  AD_HOC = 'AD_HOC',
}

export enum RequirementPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum EvidenceType {
  POLICY_DOCUMENT = 'POLICY_DOCUMENT',
  PROCEDURE_DOCUMENT = 'PROCEDURE_DOCUMENT',
  TRAINING_RECORD = 'TRAINING_RECORD',
  AUDIT_REPORT = 'AUDIT_REPORT',
  TEST_RESULTS = 'TEST_RESULTS',
  SCREENSHOT = 'SCREENSHOT',
  CERTIFICATE = 'CERTIFICATE',
  AGREEMENT = 'AGREEMENT',
  LOG_FILE = 'LOG_FILE',
  ASSESSMENT_REPORT = 'ASSESSMENT_REPORT',
  INCIDENT_REPORT = 'INCIDENT_REPORT',
  MEETING_MINUTES = 'MEETING_MINUTES',
  EMAIL_COMMUNICATION = 'EMAIL_COMMUNICATION',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  OTHER = 'OTHER',
}

export enum ControlType {
  PREVENTIVE = 'PREVENTIVE',
  DETECTIVE = 'DETECTIVE',
  CORRECTIVE = 'CORRECTIVE',
  COMPENSATING = 'COMPENSATING',
  DIRECTIVE = 'DIRECTIVE',
}

export enum ImplementationStatus {
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  PARTIALLY_IMPLEMENTED = 'PARTIALLY_IMPLEMENTED',
  IMPLEMENTED = 'IMPLEMENTED',
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
}

export enum ControlEffectiveness {
  INEFFECTIVE = 'INEFFECTIVE',
  PARTIALLY_EFFECTIVE = 'PARTIALLY_EFFECTIVE',
  LARGELY_EFFECTIVE = 'LARGELY_EFFECTIVE',
  EFFECTIVE = 'EFFECTIVE',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ACCEPTED_RISK = 'ACCEPTED_RISK',
}

export enum AssessmentStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum AssessmentScope {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  TARGETED = 'TARGETED',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum FindingSeverity {
  INFORMATIONAL = 'INFORMATIONAL',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum FindingStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ACCEPTED = 'ACCEPTED',
  CLOSED = 'CLOSED',
}

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PARTIALLY_COMPLIANT = 'PARTIALLY_COMPLIANT',
  NOT_ASSESSED = 'NOT_ASSESSED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

// Industry-specific constants
export const INDUSTRIES = {
  HEALTHCARE: 'Healthcare',
  FINANCIAL: 'Financial Services',
  TECHNOLOGY: 'Technology',
  MANUFACTURING: 'Manufacturing',
  RETAIL: 'Retail',
  EDUCATION: 'Education',
  GOVERNMENT: 'Government',
  ENERGY: 'Energy & Utilities',
  TRANSPORTATION: 'Transportation',
  REAL_ESTATE: 'Real Estate',
  CONSTRUCTION: 'Construction',
  FOOD_SERVICE: 'Food Service',
  INSURANCE: 'Insurance',
  TELECOMMUNICATIONS: 'Telecommunications',
  MEDIA: 'Media & Entertainment',
  NON_PROFIT: 'Non-Profit',
  OTHER: 'Other',
} as const;

export const JURISDICTIONS = {
  UNITED_STATES: 'United States',
  EUROPEAN_UNION: 'European Union',
  CANADA: 'Canada',
  UNITED_KINGDOM: 'United Kingdom',
  AUSTRALIA: 'Australia',
  SINGAPORE: 'Singapore',
  JAPAN: 'Japan',
  CHINA: 'China',
  INDIA: 'India',
  BRAZIL: 'Brazil',
  GLOBAL: 'Global',
  OTHER: 'Other',
} as const;

// Compliance framework templates
export const FRAMEWORK_TEMPLATES = {
  HIPAA: {
    name: 'Health Insurance Portability and Accountability Act',
    code: 'HIPAA',
    authority: 'US Department of Health and Human Services',
    industry: [INDUSTRIES.HEALTHCARE],
    jurisdiction: [JURISDICTIONS.UNITED_STATES],
  },
  GDPR: {
    name: 'General Data Protection Regulation',
    code: 'GDPR',
    authority: 'European Union',
    industry: [INDUSTRIES.TECHNOLOGY, INDUSTRIES.HEALTHCARE, INDUSTRIES.FINANCIAL, INDUSTRIES.RETAIL],
    jurisdiction: [JURISDICTIONS.EUROPEAN_UNION],
  },
  SOX: {
    name: 'Sarbanes-Oxley Act',
    code: 'SOX',
    authority: 'Securities and Exchange Commission',
    industry: [INDUSTRIES.FINANCIAL],
    jurisdiction: [JURISDICTIONS.UNITED_STATES],
  },
  PCI_DSS: {
    name: 'Payment Card Industry Data Security Standard',
    code: 'PCI-DSS',
    authority: 'PCI Security Standards Council',
    industry: [INDUSTRIES.RETAIL, INDUSTRIES.FINANCIAL, INDUSTRIES.TECHNOLOGY],
    jurisdiction: [JURISDICTIONS.GLOBAL],
  },
  ISO_27001: {
    name: 'Information Security Management Systems',
    code: 'ISO-27001',
    authority: 'International Organization for Standardization',
    industry: [INDUSTRIES.TECHNOLOGY, INDUSTRIES.FINANCIAL, INDUSTRIES.HEALTHCARE],
    jurisdiction: [JURISDICTIONS.GLOBAL],
  },
  SOC_2: {
    name: 'Service Organization Control 2',
    code: 'SOC-2',
    authority: 'American Institute of CPAs',
    industry: [INDUSTRIES.TECHNOLOGY],
    jurisdiction: [JURISDICTIONS.UNITED_STATES],
  },
  CCPA: {
    name: 'California Consumer Privacy Act',
    code: 'CCPA',
    authority: 'California Attorney General',
    industry: [INDUSTRIES.TECHNOLOGY, INDUSTRIES.RETAIL, INDUSTRIES.MEDIA],
    jurisdiction: [JURISDICTIONS.UNITED_STATES],
  },
} as const;

// Utility types for API responses
export interface ComplianceApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ComplianceMetrics {
  overallScore: number;
  complianceRate: number;
  riskDistribution: Record<RiskLevel, number>;
  categoryScores: Record<string, number>;
  trendData: ScoreTrend[];
  upcomingDeadlines: number;
  overdueItems: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'REQUIREMENT_COMPLETED' | 'ASSESSMENT_STARTED' | 'ISSUE_IDENTIFIED' | 'CONTROL_TESTED' | 'EVIDENCE_UPLOADED';
  title: string;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
}