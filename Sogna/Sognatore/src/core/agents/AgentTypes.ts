export type AgentSwarm = 'engineering' | 'operations' | 'business' | 'data' | 'product' | 'review' | 'growth' | 'orchestration';

export interface AgentRole {
  type: string;
  swarm: AgentSwarm;
  capabilities: string[];
  taskTypes: string[];
  qualityChecks: string[];
}

export const AGENT_SWARM_MAPPING: Record<AgentSwarm, string[]> = {
  engineering: ['eng-frontend', 'eng-backend', 'eng-database', 'eng-mobile', 'eng-api', 'eng-qa', 'eng-perf', 'eng-infra'],
  operations: ['ops-devops', 'ops-security', 'ops-monitor', 'ops-incident', 'ops-release', 'ops-cost', 'ops-sre', 'ops-compliance'],
  business: ['biz-marketing', 'biz-sales', 'biz-finance', 'biz-legal', 'biz-support', 'biz-hr', 'biz-investor', 'biz-partnerships'],
  data: ['data-ml', 'data-eng', 'data-analytics'],
  product: ['prod-pm', 'prod-design', 'prod-techwriter'],
  review: ['review-code', 'review-security', 'review-business'],
  growth: ['growth-hacker', 'growth-community', 'growth-success', 'growth-lifecycle'],
  orchestration: ['supervisor', 'brain', 'task-master', 'council-lead', 'orch-researcher']
};
