import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveInstitutionalRoot } from '../utils/InstitutionalRoot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DeptAgentMapFile {
  dept_tiers: Record<string, 'fast' | 'development' | 'planning'>;
  dept_aliases: Record<string, string>;
  agent_group_to_dept: Record<string, string>;
  task_type_to_dept: Record<string, string>;
  dept_class_names: Record<string, string>;
}

function loadMap(): DeptAgentMapFile {
  const root = resolveInstitutionalRoot();
  const mapPath = path.resolve(root, 'scripts/lib/dept-agent-map.json');
  return JSON.parse(readFileSync(mapPath, 'utf8')) as DeptAgentMapFile;
}

export const deptAgentMap = loadMap();

export function deptKeyToClassName(deptKey: string): string {
  return deptAgentMap.dept_class_names[deptKey] ?? 'OperationsDepartment';
}

export function mapAgentGroupToDept(agentGroup: string, taskType?: string): string {
  if (agentGroup && deptAgentMap.agent_group_to_dept[agentGroup]) {
    return deptAgentMap.agent_group_to_dept[agentGroup];
  }
  if (taskType && deptAgentMap.task_type_to_dept[taskType]) {
    return deptAgentMap.task_type_to_dept[taskType];
  }
  return 'operations';
}
