import React from 'react';
import { motion } from 'framer-motion';

/**
 * SognaInterface
 * Sintetizado por Assembler Engine.
 * Control Técnica: 100% Nativo.
 */
export const SognaInterface: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="sogna-root"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sogna Header / Status Bar */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
        className="glass-panel"
        style={{
          margin: '1rem',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.2em' }} className="text-gradient">
            SOGNA
          </div>
          <div className="mono" style={{ fontSize: '10px', opacity: 0.4, borderLeft: '1px solid var(--sogna-border)', paddingLeft: '1.5rem' }}>
            CORE_SYSTEM_BETA_v0.1.0
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', fontSize: '11px', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ opacity: 0.4 }}>ENCRYPTION:</span>
            <span style={{ color: 'var(--sogna-primary)' }}>QUANTUM_AES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ opacity: 0.4 }}>LOCATION:</span>
            <span className="mono">0.0.0.0 // LOCALHOST</span>
          </div>
        </div>
      </motion.header>

      <main style={{ flex: 1, padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </motion.div>
  );
};
