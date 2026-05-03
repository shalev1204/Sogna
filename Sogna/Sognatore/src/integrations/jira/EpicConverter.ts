import { JiraIssue } from './jiratypes.js';

/**
 * Convert a Jira epic and its child stories into a PRD markdown document.
 */
export function convertEpicToPrd(epic: JiraIssue, children: JiraIssue[] = []): string {
  const lines: string[] = [];

  // Title
  const summary = _extractText(epic.fields?.summary) || 'Untitled PRD';
  lines.push(`# ${summary}`);
  lines.push('');

  // Metadata
  lines.push('## Metadata');
  lines.push('- Source: Jira');
  lines.push(`- Epic: ${epic.key || 'unknown'}`);
  if (epic.fields?.priority) {
    lines.push(`- Priority: ${_extractText(epic.fields.priority.name)}`);
  }
  if (epic.fields?.labels && epic.fields.labels.length > 0) {
    lines.push(`- Labels: ${epic.fields.labels.join(', ')}`);
  }
  lines.push('');

  // Overview
  lines.push('## Overview');
  const desc = _extractDescription(epic.fields?.description);
  lines.push(desc || 'No description provided.');
  lines.push('');

  // Requirements / Features
  if (children.length > 0) {
    lines.push('## Requirements');
    lines.push('');
    children.forEach((child, i) => {
      const childSummary = _extractText(child.fields?.summary) || 'Untitled';
      const childKey = child.key || '';
      lines.push(`### ${i + 1}. ${childSummary} (${childKey})`);
      const childDesc = _extractDescription(child.fields?.description);
      if (childDesc) lines.push(childDesc);

      const criteria = extractAcceptanceCriteria(childDesc || '');
      if (criteria.length > 0) {
        lines.push('');
        lines.push('**Acceptance Criteria:**');
        criteria.forEach((criterion) => {
          lines.push(`- ${criterion}`);
        });
      }
      lines.push('');
    });
  }

  // Technical constraints
  if (epic.fields?.components && epic.fields.components.length > 0) {
    lines.push('## Technical Constraints');
    lines.push(`- Components: ${epic.fields.components.map((c: any) => c.name).join(', ')}`);
    lines.push('');
  }

  // Success criteria from epic description
  const epicCriteria = extractAcceptanceCriteria(desc || '');
  if (epicCriteria.length > 0) {
    lines.push('## Success Criteria');
    epicCriteria.forEach((criterion) => {
      lines.push(`- ${criterion}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Extract acceptance criteria from description text.
 */
export function extractAcceptanceCriteria(text: string): string[] {
  if (!text) return [];
  const criteria: string[] = [];
  const lines = text.split('\n');
  let inAcSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    // Detect AC section header
    if (/^#+\s*(acceptance\s*criteria|ac\b)/i.test(trimmed)) {
      inAcSection = true;
      continue;
    }
    // Another header ends AC section
    if (inAcSection && /^#+\s/.test(trimmed)) {
      inAcSection = false;
      continue;
    }
    if (inAcSection && /^[-*]\s+/.test(trimmed)) {
      criteria.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }
    // Given/When/Then patterns anywhere
    if (/^(given|when|then)\s/i.test(trimmed)) {
      criteria.push(trimmed);
    }
  }
  return criteria;
}

/**
 * Generate PRD metadata for tracking.
 */
export function generatePrdMetadata(epic: JiraIssue): Record<string, any> {
  return {
    source: 'jira',
    epicKey: epic.key || null,
    epicSummary: epic.fields?.summary || null,
    importedAt: new Date().toISOString(),
  };
}

/**
 * Extract plain text from Jira ADF or plain string.
 */
function _extractDescription(desc: any): string {
  if (!desc) return '';
  if (typeof desc === 'string') return desc;
  // ADF (Atlassian Document Format)
  if (desc.type === 'doc' && Array.isArray(desc.content)) {
    return desc.content.map((block: any) => {
      if (block.type === 'paragraph' && Array.isArray(block.content)) {
        return block.content.map((node: any) => {
          return node.text || '';
        }).join('');
      }
      return '';
    }).filter(Boolean).join('\n');
  }
  return String(desc);
}

function _extractText(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return String(val);
}
