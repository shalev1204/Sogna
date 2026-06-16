import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { delegateApi, type WorkerJob } from '../../services/DelegateApi.js';

interface ApprovalItem {
  id: string;
  agent: string;
  action: string;
  context: string;
  riskLevel: 'high' | 'medium' | 'low';
  timestamp: string;
}

export const ApprovalQueue: React.FC = () => {
  const [queue, setQueue] = useState<ApprovalItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      const jobs = await delegateApi.listJobs();
      const failed = (Array.isArray(jobs) ? jobs : []).filter((j: WorkerJob) => j.status === 'failed');
      setQueue(
        failed.map((j) => ({
          id: j.id.slice(0, 8),
          agent: 'WORKER_LOCAL',
          action: j.action || j.kind,
          context: (j.output || []).slice(-3).join('\n') || j.task || 'Sin salida',
          riskLevel: 'high' as const,
          timestamp: j.updated_at || j.created_at || '',
        })),
      );
    } catch {
      setQueue([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const handleDecision = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--sogna-border)' }}>
        <h3 className="font-display" style={{ margin: 0, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--sogna-text)' }}>
          Human-in-the-Loop
        </h3>
        <div className="font-display" style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
          Jobs worker fallidos (revisión)
        </div>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        <AnimatePresence>
          {queue.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', opacity: 0.5, paddingTop: '3rem' }}>
              <div style={{ fontSize: '32px', marginBottom: '1rem' }}>✓</div>
              <div className="font-display" style={{ fontSize: '14px' }}>Sin jobs fallidos pendientes.</div>
            </motion.div>
          ) : (
            queue.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -50, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 50, height: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                style={{ marginBottom: '1rem' }}
              >
                <div style={{ padding: '1.25rem', border: '1px solid var(--sogna-border)', borderRadius: '12px', background: 'var(--sogna-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <span className="font-display" style={{ fontSize: '12px', color: 'var(--sogna-primary)', fontWeight: 600 }}>{item.agent}</span>
                      <span className="mono" style={{ fontSize: '10px', opacity: 0.5, marginLeft: '8px' }}>#{item.id}</span>
                    </div>
                    <span className="font-display" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255, 80, 80, 0.15)', color: 'var(--sogna-error)', fontWeight: 500 }}>
                      failed
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '1rem', lineHeight: 1.5, color: 'var(--sogna-text)' }}>{item.action}</div>
                  <div className="mono" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '11px', color: 'var(--sogna-text-muted)', marginBottom: '1rem', border: '1px solid var(--sogna-border)', whiteSpace: 'pre-wrap' }}>
                    {item.context}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDecision(item.id)}
                    className="premium-button"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--sogna-border)', fontWeight: 600, fontSize: '13px' }}
                  >
                    Marcar revisado
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
