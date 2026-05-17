import React from 'react';
import { motion } from 'framer-motion';

/**
 * SognaInterface - The "Holographic" Frame
 * Implements the Phase 5 visual excellence standards.
 */
export const SognaInterface: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="sogna-root"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1
      }}
    >
      {/* 🔮 NEURAL OVERLAYS */}
      <div className="hologram-scanline" />
      <div className="hologram-flicker" />

      {/* Sogna Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
        className="glass-panel premium-glow"
        style={{
          margin: '1rem',
          padding: '1.25rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          border: '1px solid var(--sogna-light-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              fontSize: '1.75rem', 
              fontWeight: 800, 
              letterSpacing: '0.45em', 
              lineHeight: 1,
              fontFamily: "'Outfit', sans-serif"
            }} className="text-gradient">
              SOGNA
            </div>
            <div className="mono" style={{ fontSize: '8px', opacity: 0.4, letterSpacing: '0.6em', marginTop: '6px' }}>
              NEURAL_OPERATING_SYSTEM_V4
            </div>
          </div>
          <div className="mono" style={{ fontSize: '9px', opacity: 0.4, borderLeft: '1px solid var(--sogna-border)', paddingLeft: '2rem', height: '24px', display: 'flex', alignItems: 'center' }}>
            NODE_CLUSTER: 4,534 // SYNAPSES: 18,108
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ opacity: 0.3, fontSize: '8px' }}>IDENTITY_PROTOCOL</span>
            <span style={{ color: 'var(--sogna-primary)' }}>SOGNA_MASTER_SSOT</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ opacity: 0.3, fontSize: '8px' }}>CORTEX_RESONANCE</span>
            <span style={{ color: 'var(--sogna-success)' }}>SYNCHRONIZED</span>
          </div>
        </div>
      </motion.header>

      <main style={{ flex: 1, padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        {children}
      </main>

      {/* Footer Status Bar */}
      <footer className="glass-panel" style={{ margin: '0 1rem 1rem 1rem', padding: '0.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div className="mono" style={{ fontSize: '9px', opacity: 0.5 }}>
          {"[SOGNATORE_CORE] -> SYSTEM_IDLE // LISTENING_FOR_PULSE"}
        </div>
        <div className="mono" style={{ fontSize: '9px', opacity: 0.8, color: 'var(--sogna-primary)' }}>
          OPERATION_SYNAPTIC_BLOOM_ACTIVE
        </div>
      </footer>
    </motion.div>
  );
};
