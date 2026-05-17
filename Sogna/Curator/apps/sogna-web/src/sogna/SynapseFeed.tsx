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
        importance: data.importance || 'medium'
      };
      setEvents(prev => [newEvent, ...prev].slice(0, 50));
    });

    return () => unsub();
  }, []);

  const getImportanceColor = (imp: string) => {
    switch (imp) {
      case 'critical': return '#ff0055';
      case 'high': return '#ff8800';
      case 'medium': return 'var(--sogna-primary)';
      default: return 'rgba(255,255,255,0.4)';
    }
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="text-gradient" style={{ margin: 0, fontSize: '14px', letterSpacing: '0.2em' }}>SYNAPSE_FEED</h3>
        <div className="neural-pulse" style={{ width: '10px', height: '10px', background: 'var(--sogna-primary)' }}></div>
      </div>

      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}
        className="custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {events.map((ev) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-panel"
              style={{ 
                marginBottom: '0.75rem', 
                padding: '0.75rem', 
                fontSize: '11px',
                borderLeft: `3px solid ${getImportanceColor(ev.importance)}`,
                background: 'rgba(255,255,255,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6, marginBottom: '0.25rem' }}>
                <span className="mono" style={{ color: getImportanceColor(ev.importance) }}>[{ev.type}]</span>
                <span className="mono">{ev.timestamp}</span>
              </div>
              <div className="mono" style={{ color: '#fff' }}>{ev.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {events.length === 0 && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
            <div className="scanning-line" style={{ position: 'relative', height: '2px', width: '100px', marginBottom: '1rem' }}></div>
            <span className="mono">LISTENING_FOR_SYNAPTIC_PULSES...</span>
          </div>
        )}
      </div>
    </div>
  );
};
