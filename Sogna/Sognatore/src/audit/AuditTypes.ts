export type GateSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AuditEntry {
  seq: number;
  timestamp: string;
  who: string;
  what: string;
  where: string | null;
  why: string | null;
  metadata: Record<string, any> | null;
  previousHash: string;
  hash: string | null;
}

export interface AuditFilter {
  who?: string;
  what?: string;
  since?: string;
  until?: string;
}

export interface ResidencyConfig {
  allowed_providers: string[];
  allowed_regions: string[];
  air_gapped: boolean;
}

export interface AuditSummary {
  totalEntries: number;
  actors: string[];
  actions: string[];
  firstEntry: string | null;
  lastEntry: string | null;
}

export interface ComplianceControl {
  name: string;
  description: string;
}

export interface ComplianceEvidence {
  control: ComplianceControl;
  evidenceCount: number;
  sampleEntries: Array<{
    seq: number;
    timestamp: string;
    who: string;
    what: string;
  }>;
}

export interface ComplianceReport {
  reportType: string;
  generatedAt: string;
  projectName: string;
  period: string;
  totalAuditEntries: number;
  controls?: Record<string, ComplianceEvidence>;
  chainIntegrity?: any;
  // GDPR specific
  controller?: string;
  purposes?: string[];
  legalBasis?: string;
  dataSubjects?: Array<{ id: string; activityCount: number }>;
  processingActivities?: Array<{ activity: string; count: number }>;
  dataCategories?: string[];
  retentionPolicy?: string;
  securityMeasures?: string[];
}
