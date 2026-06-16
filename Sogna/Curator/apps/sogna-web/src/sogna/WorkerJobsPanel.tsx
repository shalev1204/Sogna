import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { delegateApi, type WorkerJob } from '../services/DelegateApi.js';

export const WorkerJobsPanel: React.FC = () => {
  const [jobs, setJobs] = useState<WorkerJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await delegateApi.listJobs();
      setJobs(Array.isArray(list) ? list : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const failed = jobs.filter((j) => j.status === 'failed');

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--sogna-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="font-display" style={{ margin: 0, fontSize: '16px' }}>Worker local</h3>
          <div className="mono" style={{ fontSize: '10px', opacity: 0.5 }}>Cola Ollama + scripts</div>
        </div>
        <button type="button" className="view-btn" onClick={refresh} style={{ padding: '6px 12px' }}>
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mono" style={{ padding: '1rem', color: 'var(--sogna-error)', fontSize: '11px' }}>{error}</div>
      )}

      {failed.length > 0 && (
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--sogna-border)', background: 'rgba(255,80,80,0.08)' }}>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--sogna-error)' }}>
            HITL: {failed.length} job(s) fallido(s) — revise salida
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <AnimatePresence>
          {jobs.length === 0 ? (
            <div className="mono" style={{ opacity: 0.4, textAlign: 'center', paddingTop: '2rem' }}>Sin jobs</div>
          ) : (
            jobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginBottom: '0.75rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--sogna-border)',
                  background: 'var(--sogna-surface)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--sogna-primary)' }}>
                    {job.kind} {job.action ? `· ${job.action}` : ''}
                  </span>
                  <span
                    className="engine-badge"
                    style={{
                      fontSize: '9px',
                      color:
                        job.status === 'completed'
                          ? 'var(--sogna-success)'
                          : job.status === 'failed'
                            ? 'var(--sogna-error)'
                            : 'var(--sogna-text-muted)',
                    }}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '9px', opacity: 0.4, marginBottom: '6px' }}>
                  {job.id.slice(0, 8)}…
                </div>
                {job.task && (
                  <div style={{ fontSize: '12px', marginBottom: '6px', opacity: 0.85 }}>{job.task.slice(0, 120)}</div>
                )}
                {job.output && job.output.length > 0 && (
                  <pre className="mono" style={{ fontSize: '9px', maxHeight: '80px', overflow: 'auto', margin: 0, opacity: 0.7 }}>
                    {job.output.slice(-5).join('\n')}
                  </pre>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
