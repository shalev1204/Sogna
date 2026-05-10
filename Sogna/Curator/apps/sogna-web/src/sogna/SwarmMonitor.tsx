import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEcosystem } from '../hooks/useEcosystem.js';

interface SwarmTask {
  id: string;
  type: string;
  description: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export const SwarmMonitor: React.FC = () => {
  const { swarmData, engines, fetchSwarm } = useEcosystem();

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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
      {/* AGENTS GRID */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '0.1em', opacity: 0.8 }}>ACTIVE_SWARM_AGENTS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {engines.map(agent => (
            <motion.div 
              key={agent.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel"
              style={{ padding: '1rem', borderLeft: `4px solid ${agent.status === 'active' ? 'var(--sogna-success)' : 'rgba(255,255,255,0.1)'}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="mono" style={{ fontSize: '12px', fontWeight: 700 }}>{agent.name}</span>
                <span className="mono" style={{ fontSize: '10px', opacity: 0.4 }}>{agent.provenance}</span>
              </div>
              <div style={{ fontSize: '11px', marginBottom: '1rem' }}>
                <div style={{ opacity: 0.5 }}>MESSAGES_PROCESSED:</div>
                <div style={{ color: 'var(--sogna-primary)' }}>{agent.messageCount}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div className={`status-indicator ${agent.status === 'active' ? 'status-online' : ''}`} style={{ width: '8px', height: '8px' }} />
                  <span className="mono" style={{ fontSize: '9px', opacity: 0.6 }}>{agent.status.toUpperCase()}</span>
                </div>
                <span className="mono" style={{ fontSize: '9px', opacity: 0.3 }}>
                  LATENCY: {Math.max(0, Math.floor((Date.now() - agent.lastSeen)/1000))}s
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* TASK QUEUE */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '14px', letterSpacing: '0.1em', opacity: 0.8 }}>TASK_ORCHESTRATOR</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          {swarmData.tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.2 }}>
              <div style={{ fontSize: '24px' }}>📡</div>
              <div className="mono" style={{ fontSize: '10px' }}>NO_ACTIVE_TASKS</div>
            </div>
          ) : (
            swarmData.tasks.map((task: SwarmTask) => (
              <div key={task.id} style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--sogna-primary)' }}>{task.id}</span>
                  <span className="mono" style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', opacity: 0.6 }}>
                    PRIO_{task.priority}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '0.5rem' }}>{task.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: 1, height: '2px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '60%' : '0%' }}
                      style={{ height: '100%', backgroundColor: getStatusColor(task.status) }}
                    />
                  </div>
                  <span className="mono" style={{ fontSize: '9px', color: getStatusColor(task.status) }}>{task.status.toUpperCase()}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div className="mono" style={{ fontSize: '10px', opacity: 0.4 }}>SERVICES: {swarmData.services.join(', ') || 'NONE'}</div>
        </div>
      </div>
    </div>
  );
};
