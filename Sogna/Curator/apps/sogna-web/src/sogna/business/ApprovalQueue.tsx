import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApprovalItem {
  id: string;
  agent: string;
  action: string;
  context: string;
  riskLevel: 'high' | 'medium' | 'low';
  timestamp: string;
}

export const ApprovalQueue: React.FC = () => {
  const [queue, setQueue] = useState<ApprovalItem[]>([
    {
      id: 'REQ-8992',
      agent: 'PREDATORE_CORE',
      action: 'Execute bulk asset acquisition (Equities)',
      context: 'Market sentiment shows 92% positive variance. Predicted ROI +14%. Budget allocation: $1.2M.',
      riskLevel: 'high',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'REQ-8993',
      agent: 'COMM_AGENT_01',
      action: 'Dispatch global marketing broadcast',
      context: 'Targeting 50,000 Tier-1 users with personalized Q3 promotional offers.',
      riskLevel: 'medium',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
    }
  ]);

  const handleDecision = (id: string, decision: 'approve' | 'reject') => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--sogna-border)' }}>
        <h3 className="font-display" style={{ margin: 0, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--sogna-text)' }}>
          Human-in-the-Loop
        </h3>
        <div className="font-display" style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
          Approval Queue
        </div>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        <AnimatePresence>
          {queue.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', opacity: 0.5, paddingTop: '3rem' }}>
              <div style={{ fontSize: '32px', marginBottom: '1rem' }}>✨</div>
              <div className="font-display" style={{ fontSize: '14px' }}>All actions authorized.</div>
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
                    <span className="font-display" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255, 179, 230, 0.1)', color: 'var(--sogna-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>
                      {item.riskLevel} Risk
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '1rem', lineHeight: 1.5, color: 'var(--sogna-text)' }}>
                    {item.action}
                  </div>
                  <div className="mono" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '11px', color: 'var(--sogna-text-muted)', marginBottom: '1rem', border: '1px solid var(--sogna-border)' }}>
                    {item.context}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      onClick={() => handleDecision(item.id, 'approve')}
                      className="premium-button"
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--sogna-success)', color: '#000', border: 'none', fontWeight: 600, fontSize: '13px' }}
                    >
                      Authorize
                    </button>
                    <button 
                      onClick={() => handleDecision(item.id, 'reject')}
                      className="premium-button"
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--sogna-error)', border: '1px solid transparent', fontWeight: 600, fontSize: '13px' }}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
