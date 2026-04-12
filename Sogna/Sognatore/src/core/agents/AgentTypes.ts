export type AgentSwarm = 'engineering' | 'operations' | 'business' | 'data' | 'product' | 'review' | 'growth' | 'orchestration' | string;

export interface AgentRole {
  type: string;
  swarm: AgentSwarm;
  capabilities: string[];
  taskTypes: string[];
  qualityChecks: string[];
}
