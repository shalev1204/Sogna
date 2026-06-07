import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sognaBridge } from '../services/TelemetryBridge.js';

interface SynapseEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * SynapseFeed — Córtex Holográfico: 3D Tilt Cascade Feed
 * Real-time neural pulse stream with perspective tilt and staggered entry.
 */
export const SynapseFeed: React.FC = () => {
  const [events, setEvents] = useState<SynapseEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = sognaBridge.onMessage('NEURAL_PULSE', (data: any) => {
      const newEvent: SynapseEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: data.type || 'NEURAL_ACTIVITY',
        message: data.message,
        timestamp: new Date().toLocaleTimeString(),
        importance: data.importance || 'medium',
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
    });
    return () => unsub();
  }, []);

  const getImportanceColor = (imp: string) => {
    switch (imp) {
      case 'critical': return 'hsl(350, 85%, 50%)';
      case 'high': return 'hsl(35, 100%, 55%)';
      case 'medium': return 'var(--sogna-primary)';
      default: return 'rgba(255,255,255,0.3)';
    }
  };

  const getImportanceGlow = (imp: string) => {
    switch (imp) {
      case 'critical': return '0 0 12px rgba(255, 0, 85, 0.3)';
      case 'high': return '0 0 12px rgba(255, 136, 0, 0.2)';
      default: return 'none';
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        overflow: 'hidden',
        perspective: '800px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="text-gradient font-display" style={{ margin: 0, fontSize: '11px', letterSpacing: '0.2em' }}>
          SYNAPSE_FEED
        </h3>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--sogna-primary)',
            boxShadow: '0 0 10px var(--sogna-primary)',
          }}
        />
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        <AnimatePresence initial={false}>
          {events.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -30, rotateX: -15 }}
              animate={{ opacity: 1, x: 0, rotateX: 0 }}
              exit={{ opacity: 0, x: 30, rotateX: 10 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: i < 3 ? i * 0.05 : 0,
              }}
              whileHover={{ scale: 1.01, x: 4 }}
              className="glass-panel"
              style={{
                marginBottom: '0.6rem',
                padding: '0.75rem 1rem',
                fontSize: '11px',
                borderLeft: `3px solid ${getImportanceColor(ev.importance)}`,
                background: 'rgba(255,255,255,0.015)',
                boxShadow: getImportanceGlow(ev.importance),
                cursor: 'default',
                transformStyle: 'preserve-3d',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.5, marginBottom: '0.3rem' }}>
                <span className="font-display" style={{ color: getImportanceColor(ev.importance), fontSize: '8px', letterSpacing: '0.1em' }}>
                  [{ev.type}]
                </span>
                <span className="mono" style={{ fontSize: '9px' }}>{ev.timestamp}</span>
              </div>
              <div className="mono" style={{ color: '#fff', fontSize: '11px' }}>
                {ev.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {events.length === 0 && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.25 }}>
            <motion.div
              animate={{ scaleX: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{ height: '2px', width: '80px', background: 'linear-gradient(90deg, transparent, var(--sogna-primary), transparent)', marginBottom: '1.5rem' }}
            />
            <span className="font-display" style={{ fontSize: '9px', letterSpacing: '0.2em' }}>
              LISTENING_FOR_SYNAPTIC_PULSES
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
