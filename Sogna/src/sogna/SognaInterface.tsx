import React from 'react';
import { motion } from 'framer-motion';

/**
 * SognaInterface
 * Sintetizado por Assembler Engine.
 * Soberanía Técnica: 100% Nativo.
 */
export const SognaInterface: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="sogna-root"
      style={{
        '--sogna-primary': '#00FFFF',
        '--sogna-bg': '#050510',
        '--sogna-border': '#333344',
        '--sogna-density': '1.0',
        backgroundColor: 'var(--sogna-bg)',
        color: '#E0E0FF',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      } as React.CSSProperties}
    >
      {/* SognaChrome: La "joya oculta" de la UI institucional */}
      <div className="sogna-chrome" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--sogna-border)',
        backgroundColor: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'center', opacity: 0.3, fontSize: '10px', letterSpacing: '0.1em' }}>
          SOGNA CORE v1.1.0
        </div>
      </div>

      <main style={{ flex: 1, padding: 'calc(var(--sogna-density) * 1rem)' }}>
        {children}
      </main>
    </motion.div>
  );
};
