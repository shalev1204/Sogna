export type PluginType = 'agent' | 'quality_gate' | 'integration' | 'mcp_tool';

export interface BasePluginConfig {
  type: PluginType;
  name: string;
  description?: string;
  version?: string;
  enabled?: boolean;
}

export interface AgentPluginConfig extends BasePluginConfig {
  type: 'agent';
  system_prompt: string;
  model: {
    provider: string;
    name: string;
    temperature?: number;
    max_tokens?: number;
  };
  tools?: string[];
  knowledge?: {
    files?: string[];
    directories?: string[];
  };
}

export interface QualityGatePluginConfig extends BasePluginConfig {
  type: 'quality_gate';
  check_type: string;
  threshold: number;
  action: 'block' | 'warn' | 'notify';
  parameters?: Record<string, any>;
}

export interface IntegrationPluginConfig extends BasePluginConfig {
  type: 'integration';
  provider: string;
  auth: {
    type: 'api_key' | 'oauth2' | 'basic' | 'none';
    credentials_env?: Record<string, string>;
  };
  config: Record<string, any>;
  webhook_url?: string;
  events?: string[];
}

export interface McpToolPluginConfig extends BasePluginConfig {
  type: 'mcp_tool';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  timeout?: number;
  parameters?: Array<{
    name: string;
    description: string;
    type: string;
    required?: boolean;
    default?: any;
  }>;
}

export type PluginConfig = 
  | AgentPluginConfig 
  | QualityGatePluginConfig 
  | IntegrationPluginConfig 
  | McpToolPluginConfig;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface LoadedPlugin {
  path: string;
  config: PluginConfig;
}

export interface FailedPlugin {
  path: string;
  errors: string[];
}

export interface PluginLoaderReport {
  loaded: LoadedPlugin[];
  failed: FailedPlugin[];
}
