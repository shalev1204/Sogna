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
  
  const statusColor = {
    thinking: '#94a3b8',
    executing: '{{SOGNA_COLOR_PRIMARY}}',
    completed: '#10b981',
    error: '#ef4444'
  }[status];

  return (
    <motion.div 
      layout
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      style={{
        borderLeft: `2px solid ${statusColor}`,
        paddingLeft: '1rem',
        margin: '0.25rem 0',
        backgroundColor: 'rgba(255,255,255,0.01)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ 
          fontSize: '11px', 
          fontWeight: 600, 
          textTransform: 'uppercase',
          color: statusColor,
          letterSpacing: '0.05em'
        }}>
          {toolName}
        </span>
        {detail && (
          <span style={{ fontSize: '11px', opacity: 0.5 }}>{detail}</span>
        )}
      </div>
      
      {result && (
        <div style={{ 
          marginTop: '0.5rem', 
          fontSize: '12px', 
          fontFamily: 'monospace',
          backgroundColor: 'rgba(0,0,0,0.2)',
          padding: '0.5rem',
          borderRadius: '4px',
          border: '1px solid var(--sogna-border)'
        }}>
          {result}
        </div>
      )}
    </motion.div>
  );
};
