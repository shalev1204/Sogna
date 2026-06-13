import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEcosystem } from '../hooks/useEcosystem.js';
import { AgentConfigPanel } from './AgentConfigPanel.js';

interface SwarmTask {
  id: string;
  type: string;
  description: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export const SwarmMonitor: React.FC = () => {
  const { swarmData, engines, fetchSwarm } = useEcosystem();
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  useEffect(() => {
    const interval = setInterval(fetchSwarm, 5000);
    return () => clearInterval(interval);
  }, [fetchSwarm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--sogna-success)';
      case 'in_progress': return 'var(--sogna-primary)';
      case 'pending': return 'var(--sogna-warning)';
      case 'failed': return 'var(--sogna-error)';
      default: return 'rgba(255,255,255,0.4)';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
      {/* AGENTS GRID */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
        <h3 className="font-display" style={{ margin: 0, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--sogna-text)' }}>Active Agents</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {engines.map(agent => (
            <motion.div 
              key={agent.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedAgent(agent)}
              className="glass-panel neural-border"
              style={{ 
                padding: '1.25rem', 
                cursor: 'pointer',
                background: selectedAgent?.name === agent.name ? 'rgba(0, 219, 110, 0.05)' : 'var(--sogna-panel)',
                borderLeft: `3px solid ${agent.status === 'active' ? 'var(--sogna-success)' : 'var(--sogna-border)'}` 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="font-display" style={{ fontSize: '15px', fontWeight: 600 }}>{agent.name}</span>
                <span className="font-display" style={{ fontSize: '11px', opacity: 0.6, padding: '4px 8px', background: 'var(--sogna-surface)', borderRadius: '6px' }}>{agent.provenance}</span>
              </div>
              <div style={{ fontSize: '12px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', color: 'var(--sogna-text-muted)' }}>
                <span>Messages / Pulse:</span>
                <span style={{ color: 'var(--sogna-text)', fontWeight: 600 }}>{agent.messageCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div className={`status-indicator ${agent.status === 'active' ? 'status-online' : ''}`} style={{ width: '8px', height: '8px', boxShadow: agent.status === 'active' ? '0 0 10px var(--sogna-success)' : 'none' }} />
                  <span className="font-display" style={{ fontSize: '11px', fontWeight: 500, color: agent.status === 'active' ? 'var(--sogna-success)' : 'var(--sogna-text-muted)' }}>{agent.status === 'active' ? 'Active' : 'Offline'}</span>
                </div>
                <span className="font-display" style={{ fontSize: '11px', opacity: 0.5 }}>
                  Seen: {Math.max(0, Math.floor((Date.now() - agent.lastSeen)/1000))}s ago
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL (CONFIG OR TASKS) */}
      <AnimatePresence mode="wait">
        {selectedAgent ? (
          <AgentConfigPanel key="config" agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
        ) : (
          <motion.div key="tasks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', overflow: 'hidden' }}>
            <h3 className="font-display" style={{ margin: '0 0 1.5rem 0', fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--sogna-text)' }}>Task Orchestrator</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
              {swarmData.tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.4 }}>
                  <div style={{ fontSize: '32px', marginBottom: '1rem' }}>✨</div>
                  <div className="font-display" style={{ fontSize: '14px' }}>No active tasks</div>
                </div>
              ) : (
                swarmData.tasks.map((task: SwarmTask) => (
                  <div key={task.id} style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--sogna-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--sogna-primary)' }}>{task.id}</span>
                      <span className="font-display" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--sogna-surface)', opacity: 0.8 }}>
                        Priority {task.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '0.75rem', lineHeight: 1.4 }}>{task.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--sogna-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '60%' : '0%' }}
                          style={{ height: '100%', backgroundColor: getStatusColor(task.status), borderRadius: '2px' }}
                        />
                      </div>
                      <span className="font-display" style={{ fontSize: '11px', color: getStatusColor(task.status), fontWeight: 500 }}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
