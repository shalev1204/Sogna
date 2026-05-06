import { 
  AuditEntry, 
  ComplianceReport, 
  ComplianceControl, 
  ComplianceEvidence 
} from './AuditTypes.js';

/**
 * SOC 2 Type II control mappings.
 */
export const SOC2_CONTROLS: Record<string, ComplianceControl> = {
  CC6_1: { name: 'Logical Access', description: 'Access to data and systems is restricted to authorized users' },
  CC6_2: { name: 'System Operations', description: 'System operations are monitored for anomalies' },
  CC6_3: { name: 'Change Management', description: 'Changes are authorized, tested, and approved before deployment' },
  CC7_1: { name: 'Risk Assessment', description: 'Risks are identified and mitigated' },
  CC7_2: { name: 'Monitoring', description: 'System components are monitored for anomalies' },
  CC8_1: { name: 'Incident Response', description: 'Security incidents are identified and responded to' },
};

/**
 * ISO 27001 Annex A control mappings.
 */
export const ISO27001_CONTROLS: Record<string, ComplianceControl> = {
  'A.9.2': { name: 'User Access Management', description: 'Formal access provisioning and de-provisioning' },
  'A.12.4': { name: 'Logging and Monitoring', description: 'Events are recorded and evidence is generated' },
  'A.12.5': { name: 'Control of Operational Software', description: 'Installation of software is controlled' },
  'A.14.2': { name: 'Security in Development', description: 'Security requirements in SDLC' },
  'A.16.1': { name: 'Incident Management', description: 'Consistent approach to security incidents' },
  'A.18.1': { name: 'Compliance', description: 'Compliance with legal and contractual requirements' },
};

/**
 * Map audit actions to SOC 2 controls.
 */
export const ACTION_TO_SOC2: Record<string, string[]> = {
  'agent_start': ['CC6_1', 'CC6_2'],
  'agent_stop': ['CC6_1', 'CC6_2'],
  'file_write': ['CC6_3', 'CC7_2'],
  'file_read': ['CC6_1'],
  'command_execute': ['CC6_3', 'CC7_2'],
  'deploy': ['CC6_3', 'CC8_1'],
  'policy_evaluate': ['CC7_1', 'CC7_2'],
  'approval_request': ['CC6_3'],
  'approval_resolve': ['CC6_3'],
  'test_run': ['CC6_3', 'CC7_1'],
};

/**
 * Map audit actions to ISO 27001 controls.
 */
export const ACTION_TO_ISO: Record<string, string[]> = {
  'agent_start': ['A.9.2', 'A.12.4'],
  'agent_stop': ['A.9.2', 'A.12.4'],
  'file_write': ['A.12.5', 'A.14.2'],
  'file_read': ['A.9.2'],
  'command_execute': ['A.12.5', 'A.14.2'],
  'deploy': ['A.12.5', 'A.14.2'],
  'policy_evaluate': ['A.18.1'],
  'approval_request': ['A.9.2', 'A.16.1'],
  'approval_resolve': ['A.9.2', 'A.16.1'],
  'test_run': ['A.14.2'],
};

/**
 * Generate binary reports from audit log entries.
 */
export class ComplianceEngine {
  public static generateSoc2Report(entries: AuditEntry[], opts?: { projectName?: string; period?: string }): ComplianceReport {
    const controlEvidence: Record<string, ComplianceEvidence> = {};

    // Initialize all controls
    Object.keys(SOC2_CONTROLS).forEach((id) => {
      controlEvidence[id] = {
        control: SOC2_CONTROLS[id],
        evidenceCount: 0,
        sampleEntries: [],
      };
    });

    // Map entries to controls
    for (const entry of entries) {
      const controls = ACTION_TO_SOC2[entry.what] || [];
      for (const cid of controls) {
        if (controlEvidence[cid]) {
          controlEvidence[cid].evidenceCount++;
          if (controlEvidence[cid].sampleEntries.length < 5) {
            controlEvidence[cid].sampleEntries.push({
              seq: entry.seq,
              timestamp: entry.timestamp,
              who: entry.who,
              what: entry.what,
            });
          }
        }
      }
    }

    return {
      reportType: 'SOC2_TYPE_II',
      generatedAt: new Date().toISOString(),
      projectName: opts?.projectName || 'Sognatore',
      period: opts?.period || 'Current',
      totalAuditEntries: entries.length,
      controls: controlEvidence,
      chainIntegrity: null,
    };
  }

  public static generateIso27001Report(entries: AuditEntry[], opts?: { projectName?: string; period?: string }): ComplianceReport {
    const controlEvidence: Record<string, ComplianceEvidence> = {};

    Object.keys(ISO27001_CONTROLS).forEach((id) => {
      controlEvidence[id] = {
        control: ISO27001_CONTROLS[id],
        evidenceCount: 0,
        sampleEntries: [],
      };
    });

    for (const entry of entries) {
      const controls = ACTION_TO_ISO[entry.what] || [];
      for (const cid of controls) {
        if (controlEvidence[cid]) {
          controlEvidence[cid].evidenceCount++;
          if (controlEvidence[cid].sampleEntries.length < 5) {
            controlEvidence[cid].sampleEntries.push({
              seq: entry.seq,
              timestamp: entry.timestamp,
              who: entry.who,
              what: entry.what,
            });
          }
        }
      }
    }

    return {
      reportType: 'ISO27001',
      generatedAt: new Date().toISOString(),
      projectName: opts?.projectName || 'Sognatore',
      period: opts?.period || 'Current',
      totalAuditEntries: entries.length,
      controls: controlEvidence,
    };
  }

  public static generateGdprReport(entries: AuditEntry[], opts?: { projectName?: string; controller?: string; retentionDays?: number }): ComplianceReport {
    const subjects: Record<string, number> = {};
    const activities: Record<string, number> = {};
    const dataCategories: Set<string> = new Set();

    for (const entry of entries) {
      subjects[entry.who] = (subjects[entry.who] || 0) + 1;
      activities[entry.what] = (activities[entry.what] || 0) + 1;

      if (entry.metadata) {
        if (entry.metadata.dataType) {
          dataCategories.add(String(entry.metadata.dataType));
        }
        if (entry.metadata.containsPii) {
          dataCategories.add('personal_data');
        }
      }
    }

    return {
      reportType: 'GDPR_DATA_PROCESSING_RECORD',
      generatedAt: new Date().toISOString(),
      projectName: opts?.projectName || 'Sognatore',
      controller: opts?.controller || 'Organization',
      purposes: ['Autonomous software development', 'Quality assurance', 'Deployment'],
      legalBasis: 'Legitimate interest (automated software development)',
      dataSubjects: Object.keys(subjects).map((s) => ({ id: s, activityCount: subjects[s] })),
      processingActivities: Object.keys(activities).map((a) => ({ activity: a, count: activities[a] })),
      dataCategories: Array.from(dataCategories),
      retentionPolicy: opts?.retentionDays ? `${opts.retentionDays} days` : 'Project lifetime',
      securityMeasures: [
        'Hash-chain tamper evidence on audit log',
        'Policy-based access controls',
        'Data residency enforcement',
      ],
      totalAuditEntries: entries.length,
      period: 'Current',
    };
  }

  public static exportReportJson(report: ComplianceReport): string {
    return JSON.stringify(report, null, 2);
  }
}
