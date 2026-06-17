import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { delegateApi, type AgentSummary, type RouteResult, type BriefResult, type WorkerJob } from '../services/DelegateApi.js';

export const DelegateConsole: React.FC = () => {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [task, setTask] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [brief, setBrief] = useState<BriefResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastEnqueuedJobId, setLastEnqueuedJobId] = useState<string | null>(null);
  const [trackedJob, setTrackedJob] = useState<WorkerJob | null>(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    delegateApi
      .listAgents()
      .then((r) => setAgents(r.agents))
      .catch((e) => setError(e.message));
  }, []);

  const handleRoute = useCallback(async () => {
    if (!task.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await delegateApi.routeTask(task.trim());
      setRoute(r);
      if (r.recommended_agents[0]) setSelectedAgent(r.recommended_agents[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [task]);

  const handleBrief = useCallback(async () => {
    if (!task.trim() && !selectedAgent) return;
    setLoading(true);
    setError(null);
    try {
      const b = await delegateApi.buildBrief({
        task: task.trim() || undefined,
        agent_id: selectedAgent || undefined,
        query: task.trim() || undefined,
      });
      setBrief(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [task, selectedAgent]);

  const handleEnqueueScript = useCallback(async () => {
    const action = route?.suggested_worker?.action || 'mcp-clients';
    setLoading(true);
    try {
      const result = await delegateApi.enqueue({ kind: 'script', action });
      setLastEnqueuedJobId(result.job_id);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [route]);

  const handleEnqueueDept = useCallback(async () => {
    if (!task.trim() && !route?.suggested_worker?.task) return;
    const agentId = selectedAgent || route?.suggested_worker?.agent_id || route?.primary_agent_id;
    if (!agentId) {
      setError('No hay agente disponible para kind=dept. Enrute o seleccione un agente.');
      return;
    }
    setLoading(true);
    try {
      const result = await delegateApi.enqueue({
        kind: 'dept',
        agent_id: agentId,
        task: task.trim() || route?.suggested_worker?.task || '',
      });
      setLastEnqueuedJobId(result.job_id);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [route, selectedAgent, task]);

  const handleEnqueueOllama = useCallback(async () => {
    if (!task.trim()) return;
    setLoading(true);
    try {
      const result = await delegateApi.enqueue({ kind: 'ollama', task: task.trim() });
      setLastEnqueuedJobId(result.job_id);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [task]);

  const refreshTrackedJob = useCallback(async (jobId: string) => {
    const status = await delegateApi.jobStatus(jobId);
    setTrackedJob(status);
    return status;
  }, []);

  useEffect(() => {
    if (!lastEnqueuedJobId) {
      setTracking(false);
      setTrackedJob(null);
      return undefined;
    }
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      try {
        setTracking(true);
        const status = await refreshTrackedJob(lastEnqueuedJobId);
        if (
          status.status === 'completed' ||
          status.status === 'failed'
        ) {
          if (interval) clearInterval(interval);
          interval = null;
          if (!cancelled) setTracking(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setTracking(false);
        }
      }
    };

    void run();
    interval = setInterval(run, 2500);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [lastEnqueuedJobId, refreshTrackedJob]);

  const copyBrief = () => {
    if (!brief?.brief) return;
    navigator.clipboard.writeText(brief.brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel premium-glow" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--sogna-border)' }}>
        <h3 className="font-display" style={{ margin: 0, fontSize: '18px' }}>Delegar (MCP-First)</h3>
        <div className="mono" style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
          Sin API cloud — routing + worker local Ollama
        </div>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflow: 'hidden' }}>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Describa la tarea (ej. auditar seguridad del módulo MCP-Bridge)..."
          className="mono"
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--sogna-border)',
            background: 'rgba(0,0,0,0.25)',
            color: 'var(--sogna-text)',
            resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="premium-button view-btn active" onClick={handleRoute} disabled={loading}>
            Enrutar
          </button>
          <button type="button" className="premium-button view-btn" onClick={handleBrief} disabled={loading}>
            Generar brief
          </button>
          <button type="button" className="premium-button view-btn" onClick={handleEnqueueScript} disabled={loading}>
            Job script
          </button>
          <button
            type="button"
            className="premium-button view-btn"
            onClick={handleEnqueueDept}
            disabled={loading || (!task.trim() && !route?.suggested_worker?.task)}
          >
            Job dept
          </button>
          <button type="button" className="premium-button view-btn" onClick={handleEnqueueOllama} disabled={loading || !task.trim()}>
            Job Ollama
          </button>
          {brief && (
            <button type="button" className="premium-button view-btn" onClick={copyBrief}>
              {copied ? 'Copiado' : 'Copiar brief'}
            </button>
          )}
        </div>

        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="mono"
          style={{ padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: 'var(--sogna-text)', border: '1px solid var(--sogna-border)' }}
        >
          <option value="">— Agente opcional —</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.id} ({a.agent_group})
            </option>
          ))}
        </select>

        {error && (
          <div className="mono" style={{ color: 'var(--sogna-error)', fontSize: '12px' }}>
            {error}
          </div>
        )}

        {lastEnqueuedJobId && (
          <div
            className="glass-panel"
            style={{ padding: '0.75rem', border: '1px solid var(--sogna-border)', background: 'rgba(0,0,0,0.2)' }}
          >
            <div className="mono" style={{ fontSize: '10px', color: 'var(--sogna-primary)', marginBottom: '6px' }}>
              TRACKING JOB {lastEnqueuedJobId.slice(0, 8)}…
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <div className="mono" style={{ fontSize: '11px', opacity: 0.8 }}>
                Estado: {trackedJob?.status || (tracking ? 'consultando...' : 'pendiente')}
                {trackedJob?.exit_code != null ? ` · exit=${trackedJob.exit_code}` : ''}
              </div>
              <button
                type="button"
                className="view-btn"
                style={{ padding: '4px 10px' }}
                onClick={() => void refreshTrackedJob(lastEnqueuedJobId)}
              >
                Refrescar
              </button>
            </div>
            {trackedJob?.output && trackedJob.output.length > 0 && (
              <pre className="mono" style={{ marginTop: '8px', marginBottom: 0, maxHeight: '90px', overflow: 'auto', fontSize: '10px', opacity: 0.75 }}>
                {trackedJob.output.slice(-6).join('\n')}
              </pre>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: brief ? '1fr 1fr' : '1fr', gap: '1rem' }}>
          {route && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '1rem' }}>
              <div className="mono" style={{ fontSize: '10px', color: 'var(--sogna-primary)', marginBottom: '8px' }}>ROUTING</div>
              <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(route, null, 2)}</pre>
            </motion.div>
          )}
          {brief && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '1rem' }}>
              <div className="mono" style={{ fontSize: '10px', color: 'var(--sogna-primary)', marginBottom: '8px' }}>BRIEF</div>
              <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', margin: 0, maxHeight: '400px', overflow: 'auto' }}>{brief.brief}</pre>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
