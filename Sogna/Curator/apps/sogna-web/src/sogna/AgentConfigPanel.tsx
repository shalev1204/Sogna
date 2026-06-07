import React from 'react';
import { motion } from 'framer-motion';

interface AgentConfigPanelProps {
  agent: any;
  onClose: () => void;
}

export const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({ agent, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="glass-panel premium-glow neural-border"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--sogna-border)' }}>
        <div>
          <h3 className="font-display text-gradient" style={{ margin: 0, fontSize: '18px' }}>
            Agent Configuration
          </h3>
          <div className="mono" style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
            Node: {agent.name}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="view-btn"
          style={{ padding: '6px 12px', borderRadius: '6px' }}
        >
          <span className="font-display" style={{ fontSize: '12px' }}>Close</span>
        </button>
      </div>

      <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="font-display" style={{ fontSize: '12px', color: 'var(--sogna-text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Autonomy Protocol</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--sogna-border)', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="radio" name="autonomy" defaultChecked />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>Supervised (Human-in-the-Loop)</div>
                <div className="mono" style={{ fontSize: '9px', opacity: 0.5 }}>Requires approval for high-risk actions.</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(0, 219, 110, 0.05)', border: '1px solid var(--sogna-primary)', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="radio" name="autonomy" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sogna-primary)' }}>Fully Autonomous</div>
                <div className="mono" style={{ fontSize: '9px', opacity: 0.8, color: 'var(--sogna-primary)' }}>Agent executes all actions without supervision.</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--sogna-border)', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="radio" name="autonomy" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>Strict Constraints</div>
                <div className="mono" style={{ fontSize: '9px', opacity: 0.5 }}>Read-only memory access. No execution rights.</div>
              </div>
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
          <div className="font-display" style={{ fontSize: '12px', color: 'var(--sogna-text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Resource Limits</div>
          <div style={{ padding: '1.5rem', background: 'var(--sogna-surface)', border: '1px solid var(--sogna-border)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="font-display" style={{ fontSize: '12px' }}>Max Tokens per Pulse</span>
              <span className="font-display" style={{ fontSize: '12px', color: 'var(--sogna-primary)' }}>8192</span>
            </div>
            <input type="range" min="1024" max="32000" defaultValue="8192" style={{ width: '100%', accentColor: 'var(--sogna-primary)' }} />
          </div>
        </div>

        <div>
          <div className="font-display" style={{ fontSize: '12px', color: 'var(--sogna-text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Live Memory Context</div>
          <div className="mono" style={{ padding: '1.5rem', background: 'var(--sogna-surface)', border: '1px solid var(--sogna-border)', borderRadius: '12px', fontSize: '11px', color: 'var(--sogna-text-muted)', height: '120px', overflowY: 'auto', lineHeight: 1.6 }}>
            [00:01:23] Context hydrated from VectorDB.<br/>
            [00:01:24] Waiting for orchestrator pulse...<br/>
            [00:01:45] Pulled 3 relevant documents.<br/>
            [00:02:10] Idling...
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--sogna-border)', background: 'var(--sogna-surface)' }}>
        <button className="premium-button" style={{ width: '100%', padding: '14px', borderRadius: '10px', background: 'var(--sogna-primary)', color: '#000', border: 'none', fontWeight: 600, fontSize: '14px' }} onClick={onClose}>
          Apply Configuration
        </button>
      </div>
    </motion.div>
  );
};
