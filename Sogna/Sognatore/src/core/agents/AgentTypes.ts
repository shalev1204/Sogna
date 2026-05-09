export type Agentswarm = 'engineering' | 'operations' | 'business' | 'data' | 'product' | 'review' | 'growth' | 'orchestration' | string;

export interface AgentRole {
  type: string;
  swarm: Agentswarm;
  capabilities: string[];
  taskTypes: string[];
  qualityChecks: string[];
}
