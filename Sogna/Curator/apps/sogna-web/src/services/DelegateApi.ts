const BRIDGE_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.DEV
    ? ''
    : typeof import.meta !== 'undefined' && import.meta.env?.VITE_BRIDGE_URL
      ? String(import.meta.env.VITE_BRIDGE_URL)
      : 'http://127.0.0.1:8001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BRIDGE_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface AgentSummary {
  id: string;
  name: string;
  agent_group: string;
  task_types: string[];
}

export interface RouteResult {
  task_type: string;
  departments: string[];
  recommended_agents: AgentSummary[];
  primary_agent_id?: string;
  suggested_worker: { kind: string; action?: string; tier?: string; task?: string; agent_id?: string };
}

export interface BriefResult {
  brief: string;
  agent_id?: string;
  agents_available: number;
}

export interface WorkerJob {
  id: string;
  kind: string;
  status: string;
  action?: string;
  agent_id?: string;
  task?: string;
  output?: string[];
  exit_code?: number | null;
  created_at?: string;
  updated_at?: string;
}

export const delegateApi = {
  baseUrl: BRIDGE_BASE,

  listAgents(): Promise<{ count: number; agents: AgentSummary[] }> {
    return request('/api/agents');
  },

  routeTask(task: string): Promise<RouteResult> {
    return request('/api/route', { method: 'POST', body: JSON.stringify({ task }) });
  },

  buildBrief(payload: { task?: string; agent_id?: string; query?: string }): Promise<BriefResult> {
    return request('/api/brief', { method: 'POST', body: JSON.stringify(payload) });
  },

  listScripts(): Promise<{ scripts: string[] }> {
    return request('/api/worker/scripts');
  },

  listJobs(): Promise<WorkerJob[]> {
    return request('/api/worker/jobs');
  },

  jobStatus(id: string): Promise<WorkerJob> {
    return request(`/api/worker/jobs/${id}`);
  },

  enqueue(payload: {
    kind: 'script' | 'ollama' | 'dept';
    action?: string;
    agent_id?: string;
    task?: string;
    tier?: string;
  }): Promise<{ job_id: string; status: string }> {
    return request('/api/worker/enqueue', { method: 'POST', body: JSON.stringify(payload) });
  },
};
