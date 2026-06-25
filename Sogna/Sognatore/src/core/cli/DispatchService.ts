import path from 'path';
import { pathToFileURL } from 'url';
import { Hub } from '../../Sentinel-Sognatore/Hub.js';

type AmplifierLibs = {
  listAgents: (root: string) => unknown[];
  getAgentPlaybook: (root: string, id: string) => unknown;
  routeTask: (root: string, task: string) => unknown;
  getProjectContext: (root: string) => unknown;
  enqueueWorkerJob: (root: string, opts: Record<string, unknown>) => unknown;
  getWorkerJobStatus: (root: string, id: string) => Promise<unknown>;
  listWorkerJobs: (root: string) => unknown[];
  SCRIPT_REGISTRY: Record<string, unknown>;
};

type BriefModule = {
  buildDispatchBrief: (
    root: string,
    opts: { task?: string; agentId?: string; query?: string; umaRecall?: string },
  ) => { brief: string; agent_id?: string; context: unknown; agents_available: number };
};

let libs: AmplifierLibs | null = null;
let briefMod: BriefModule | null = null;

export function resolveSognaRoot(): string {
  return path.resolve(Hub.getInstance().getSognatoreRoot(), '..');
}

async function loadLibs(): Promise<AmplifierLibs> {
  if (libs) return libs;
  const root = resolveSognaRoot();
  const libDir = path.join(root, 'scripts', 'lib');
  const [agent, router, context, worker, brief] = await Promise.all([
    import(pathToFileURL(path.join(libDir, 'agent-catalog.mjs')).href),
    import(pathToFileURL(path.join(libDir, 'task-router.mjs')).href),
    import(pathToFileURL(path.join(libDir, 'project-context.mjs')).href),
    import(pathToFileURL(path.join(libDir, 'worker-queue.mjs')).href),
    import(pathToFileURL(path.join(libDir, 'dispatch-brief.mjs')).href),
  ]);
  libs = {
    listAgents: agent.listAgents,
    getAgentPlaybook: agent.getAgentPlaybook,
    routeTask: router.routeTask,
    getProjectContext: context.getProjectContext,
    enqueueWorkerJob: worker.enqueueWorkerJob,
    getWorkerJobStatus: worker.getWorkerJobStatus,
    listWorkerJobs: worker.listWorkerJobs,
    SCRIPT_REGISTRY: worker.SCRIPT_REGISTRY,
  };
  briefMod = brief as BriefModule;
  return libs;
}

async function loadBrief(): Promise<BriefModule> {
  await loadLibs();
  return briefMod!;
}

export async function fetchUmaRecall(query: string): Promise<string | null> {
  try {
    const res = await fetch('http://127.0.0.1:8080/memory/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, n_results: 3 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { raw_output?: string };
    return data.raw_output ?? null;
  } catch {
    return null;
  }
}

export interface DispatchOptions {
  agent?: string;
  dept?: string;
  action?: string;
  task?: string;
  query?: string;
  json?: boolean;
  wait?: boolean;
}

export async function runDispatch(opts: DispatchOptions): Promise<unknown> {
  const root = resolveSognaRoot();
  const m = await loadLibs();
  const brief = await loadBrief();

  if (opts.action && opts.dept) {
    const result = m.enqueueWorkerJob(root, { kind: 'script', action: opts.action });
    if (opts.wait && result && typeof result === 'object' && 'job_id' in result) {
      const jobId = (result as { job_id: string }).job_id;
      await pollJob(root, jobId, m);
      const status = await m.getWorkerJobStatus(root, jobId);
      const payload = { dispatch: 'script', dept: opts.dept, action: opts.action, job: status };
      return opts.json ? payload : formatJobOutput(payload);
    }
    return opts.json ? result : JSON.stringify(result, null, 2);
  }

  if (opts.agent || opts.task || opts.query) {
    const umaRecall = opts.query ? await fetchUmaRecall(opts.query) : null;
    const briefResult = brief.buildDispatchBrief(root, {
      task: opts.task || opts.query,
      agentId: opts.agent,
      query: opts.query,
      umaRecall: umaRecall ?? undefined,
    });
    return opts.json ? briefResult : briefResult.brief;
  }

  throw new Error(
    'Use --agent <id> [--query text] | --task text | --dept <dept> --action <script-id>',
  );
}

export interface WorkerEnqueueOptions {
  kind: 'script' | 'ollama' | 'dept';
  action?: string;
  task?: string;
  agent_id?: string;
  tier?: string;
  json?: boolean;
  wait?: boolean;
}

export async function runWorkerEnqueue(opts: WorkerEnqueueOptions): Promise<unknown> {
  const root = resolveSognaRoot();
  const m = await loadLibs();
  if (opts.kind === 'dept' && (!opts.agent_id || !opts.task)) {
    throw new Error('kind=dept requiere agent_id y task');
  }
  const result = m.enqueueWorkerJob(root, {
    kind: opts.kind,
    action: opts.action,
    task: opts.task,
    agent_id: opts.agent_id,
    tier: opts.tier,
  });

  if (opts.wait && result && typeof result === 'object' && 'job_id' in result) {
    const jobId = (result as { job_id: string }).job_id;
    await pollJob(root, jobId, m);
    const status = await m.getWorkerJobStatus(root, jobId);
    return opts.json ? status : JSON.stringify(status, null, 2);
  }

  return opts.json ? result : JSON.stringify(result, null, 2);
}

export async function runWorkerStatus(jobId: string, json?: boolean): Promise<unknown> {
  const root = resolveSognaRoot();
  const m = await loadLibs();
  const status = await m.getWorkerJobStatus(root, jobId);
  if (!status) throw new Error(`Job no encontrado: ${jobId}`);
  return json ? status : JSON.stringify(status, null, 2);
}

export async function runWorkerList(json?: boolean): Promise<unknown> {
  const root = resolveSognaRoot();
  const m = await loadLibs();
  const jobs = m.listWorkerJobs(root);
  return json ? jobs : JSON.stringify(jobs, null, 2);
}

export async function listScriptActions(): Promise<string[]> {
  const m = await loadLibs();
  return Object.keys(m.SCRIPT_REGISTRY);
}

async function pollJob(
  root: string,
  jobId: string,
  m: AmplifierLibs,
  maxMs = 120000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const status = (await m.getWorkerJobStatus(root, jobId)) as { status?: string } | null;
    if (status?.status === 'completed' || status?.status === 'failed') return;
    await new Promise((r) => setTimeout(r, 1500));
  }
}

function formatJobOutput(payload: unknown): string {
  return JSON.stringify(payload, null, 2);
}
