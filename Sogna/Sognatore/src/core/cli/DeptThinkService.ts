import path from 'path';
import { pathToFileURL } from 'url';
import { Hub } from '../../Sentinel-Sognatore/Hub.js';
import { DeptAgentRuntime } from '../dept/DeptAgentRuntime.js';
import type { DeptAgentProfile } from '../dept/DeptAgentRuntime.js';

type BridgeModule = {
  buildDeptAgentProfile: (
    root: string,
    agentId: string,
    taskType?: string,
  ) => {
    error?: string;
    available?: string[];
    profile?: DeptAgentProfile & { dept_key?: string; invoke_tier?: string };
    model_route?: { provider: string; model: string; task_type: string };
  };
  buildDeptRuntimePackage: (
    root: string,
    task: string,
    preferredAgentId?: string,
  ) => Record<string, unknown>;
};

function resolveSognaRoot(): string {
  return path.resolve(Hub.getInstance().getSognatoreRoot(), '..');
}

async function loadBridge(): Promise<BridgeModule> {
  const root = resolveSognaRoot();
  const bridgePath = path.join(root, 'scripts', 'lib', 'dept-agent-bridge.mjs');
  return import(pathToFileURL(bridgePath).href) as Promise<BridgeModule>;
}

export interface DeptThinkOptions {
  agent: string;
  task: string;
  json?: boolean;
  useRuntime?: boolean;
}

export async function runDeptThink(opts: DeptThinkOptions): Promise<unknown> {
  process.env.SOGNA_LOCAL_MODE = process.env.SOGNA_LOCAL_MODE || 'true';
  process.env.SOGNATORE_KEYLESS = process.env.SOGNATORE_KEYLESS || 'true';

  const root = resolveSognaRoot();
  const bridge = await loadBridge();
  const built = bridge.buildDeptAgentProfile(root, opts.agent);

  if (built.error || !built.profile) {
    throw new Error(built.error || `Agente no encontrado: ${opts.agent}`);
  }

  const profile: DeptAgentProfile = {
    id: built.profile.id,
    role: built.profile.role,
    specialty: built.profile.specialty,
    department: built.profile.department,
  };

  let output: string;
  if (opts.useRuntime !== false) {
    try {
      output = await DeptAgentRuntime.think(profile, opts.task);
    } catch {
      const { runDeptThink: runWorkerThink } = await import(
        pathToFileURL(path.join(root, 'scripts', 'run-dept-think.mjs')).href
      );
      const fallback = await runWorkerThink(root, opts.agent, opts.task, { json: true });
      if (!fallback.ok) throw new Error(fallback.error || 'Dept think falló');
      output = String(fallback.output || '');
    }
  } else {
    const { runDeptThink: runWorkerThink } = await import(
      pathToFileURL(path.join(root, 'scripts', 'run-dept-think.mjs')).href
    );
    const result = await runWorkerThink(root, opts.agent, opts.task, { json: true });
    if (!result.ok) throw new Error(result.error || 'Dept think falló');
    output = String(result.output || '');
  }

  const payload = {
    agent_id: opts.agent,
    profile: built.profile,
    model_route: built.model_route,
    output,
    runtime: 'DeptAgentRuntime',
  };

  return opts.json ? payload : output;
}

export async function resolveDeptRoute(task: string, agentId?: string): Promise<unknown> {
  const root = resolveSognaRoot();
  const bridge = await loadBridge();
  return bridge.buildDeptRuntimePackage(root, task, agentId);
}
