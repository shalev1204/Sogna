import React from 'react';
import { motion } from 'framer-motion';

/**
 * SognaToolRow
 * Renderiza invocaciones de herramientas con estética institucional.
 */
export const SognaToolRow: React.FC<{ 
  toolName: string, 
  status: 'thinking' | 'executing' | 'completed' | 'error',
  detail?: string,
  result?: string 
}> = ({ toolName, status, detail, result }) => {
  
  const statusConfig = {
    thinking: { color: 'var(--sogna-text-muted)', icon: '●' },
    executing: { color: 'var(--sogna-primary)', icon: '▶' },
    completed: { color: 'var(--sogna-success)', icon: '✓' },
    error: { color: 'var(--sogna-error)', icon: '✕' }
  }[status];

  return (
    <motion.div 
      layout
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="glass-panel"
      style={{
        padding: '0.75rem 1rem',
        margin: '0.5rem 0',
        borderLeft: `3px solid ${statusConfig.color}`,
        background: 'rgba(255,255,255,0.01)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: statusConfig.color, fontSize: '12px' }}>{statusConfig.icon}</span>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            textTransform: 'uppercase',
            color: 'var(--sogna-text)',
            letterSpacing: '0.1em'
          }}>
            {toolName}
          </span>
          {detail && (
            <span className="mono" style={{ fontSize: '10px', opacity: 0.4 }}>{detail}</span>
          )}
        </div>
        <div className="mono" style={{ fontSize: '9px', opacity: 0.3 }}>
          {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      {result && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mono"
          style={{ 
            marginTop: '0.75rem', 
            fontSize: '11px', 
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.05)',
            color: 'rgba(224, 224, 255, 0.8)',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap'
          }}
        >
          {result}
        </motion.div>
      )}
    </motion.div>
  );
};
