import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface CortexHeatmapProps {
  intensity?: number; // 0 to 100
}

export const CortexHeatmap: React.FC<CortexHeatmapProps> = ({ intensity = 45 }) => {
  // Generar una malla de 10x10 neuronas
  const grid = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      baseActivity: Math.random() * 0.3,
      position: {
        x: (i % 10) * 10,
        y: Math.floor(i / 10) * 10
      }
    }));
  }, []);

  return (
    <div className="glass-panel premium-glow" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '1.5rem',
      background: 'radial-gradient(circle at center, rgba(0,255,255,0.05) 0%, transparent 70%)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="text-gradient" style={{ margin: 0, fontSize: '14px', letterSpacing: '0.2em' }}>CORTEX_HEATMAP</h3>
        <span className="mono" style={{ fontSize: '10px', opacity: 0.5 }}>RESONANCE: {intensity}%</span>
      </div>

      <div style={{ 
        flex: 1, 
        display: 'grid', 
        gridTemplateColumns: 'repeat(10, 1fr)', 
        gridTemplateRows: 'repeat(10, 1fr)',
        gap: '4px',
        padding: '10px',
        position: 'relative'
      }}>
        {grid.map((cell) => {
          const activity = (cell.baseActivity + (intensity / 100) * Math.random()) % 1;
          return (
            <motion.div
              key={cell.id}
              initial={false}
              animate={{
                background: activity > 0.7 
                  ? 'var(--sogna-primary)' 
                  : activity > 0.4 
                  ? 'rgba(0, 255, 255, 0.3)' 
                  : 'rgba(255, 255, 255, 0.05)',
                boxShadow: activity > 0.8 
                  ? '0 0 10px var(--sogna-primary)' 
                  : 'none',
                scale: activity > 0.7 ? 1.1 : 1
              }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
              style={{
                borderRadius: '2px',
                aspectRatio: '1/1'
              }}
            />
          );
        })}
        
        {/* Scanning Overlay */}
        <div className="scanning-line" style={{ height: '100%', width: '1px', background: 'rgba(0,255,255,0.2)', position: 'absolute', top: 0, left: 0, animation: 'scan-horizontal 8s linear infinite' }}></div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '0.75rem', fontSize: '10px' }}>
          <div className="mono" style={{ opacity: 0.5, marginBottom: '0.25rem' }}>ACTIVE_CLUSTERS</div>
          <div className="mono text-gradient" style={{ fontSize: '14px' }}>{Math.floor(intensity * 1.2)}</div>
        </div>
        <div className="glass-panel" style={{ padding: '0.75rem', fontSize: '10px' }}>
          <div className="mono" style={{ opacity: 0.5, marginBottom: '0.25rem' }}>SYNAPTIC_LOAD</div>
          <div className="mono" style={{ fontSize: '14px' }}>{(intensity * 0.08).toFixed(2)} TB/s</div>
        </div>
      </div>
    </div>
  );
};
