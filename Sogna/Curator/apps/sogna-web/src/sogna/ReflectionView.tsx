import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sognaBridge } from '../services/TelemetryBridge.js';

interface ReflectionFile {
  name: string;
  path: string;
  timestamp: number;
}

export const ReflectionView: React.FC = () => {
  const [reflections, setReflections] = useState<ReflectionFile[]>([]);
  const [isReflecting, setIsReflecting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedReflection, setSelectedReflection] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    const unsubList = sognaBridge.onMessage('REFLECTIONS_LIST', (data) => {
      setReflections(data.files);
    });

    const unsubLog = sognaBridge.onMessage('REFLECTION_LOG', (data) => {
      setLogs(prev => [...prev.slice(-10), data.message]);
    });

    const unsubComplete = () => {
      setIsReflecting(false);
      sognaBridge.fetchReflections();
    };
    sognaBridge.onMessage('REFLECTION_COMPLETE', unsubComplete);

    const unsubContent = sognaBridge.onMessage('MEMORY_FILE_CONTENT', (data) => {
      if (selectedReflection && data.path.includes(selectedReflection)) {
        setContent(data.content);
      }
    });

    sognaBridge.fetchReflections();

    return () => {
      unsubList();
      unsubLog();
      unsubComplete();
      unsubContent();
    };
  }, [selectedReflection]);

  const handleTrigger = () => {
    setIsReflecting(true);
    setLogs(['[SYSTEM] Initializing Reflection Engine...']);
    sognaBridge.triggerReflection();
  };

  const handleSelect = (file: ReflectionFile) => {
    setSelectedReflection(file.name);
    sognaBridge.readMemoryFile(file.path);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
      {/* LEFT SIDE: HISTORY & ACTIONS */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 className="mono" style={{ fontSize: '14px', marginBottom: '1rem', opacity: 0.8 }}>EPISODIC_RECALL</h3>
          <button 
            onClick={handleTrigger}
            disabled={isReflecting}
            className={`premium-button ${isReflecting ? 'loading' : ''}`}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}
          >
            {isReflecting ? 'REFLECTING...' : 'TRIGGER_REFLECTION'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence>
            {reflections.map((file) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleSelect(file)}
                className={`reflection-card ${selectedReflection === file.name ? 'active' : ''}`}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: selectedReflection === file.name ? 'rgba(0, 242, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedReflection === file.name ? 'var(--sogna-primary)' : 'rgba(255,255,255,0.05)'}`,
                  cursor: 'pointer'
                }}
              >
                <div className="mono" style={{ fontSize: '10px', opacity: 0.4 }}>[{new Date(file.timestamp).toLocaleDateString()}]</div>
                <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>{file.name.replace('episodic_reflection_', '').replace('.md', '')}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT SIDE: CONTENT OR LIVE LOGS */}
      <div className="glass-panel premium-glow" style={{ display: 'flex', flexDirection: 'column', padding: '2rem', overflow: 'hidden' }}>
        {isReflecting ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="neural-pulse" style={{ margin: '0 auto 2rem' }} />
            <div className="mono" style={{ fontSize: '11px', color: 'var(--sogna-primary)', textAlign: 'center' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
              ))}
            </div>
          </div>
        ) : selectedReflection ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className="markdown-content mono" style={{ fontSize: '13px', lineHeight: 1.6 }}>
              {content.split('\n').map((line, i) => (
                <div key={i} style={{ marginBottom: '0.5rem' }}>{line}</div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            <div className="mono" style={{ marginTop: '1rem', fontSize: '12px' }}>SELECT_REFLECTION_TO_DECODE</div>
          </div>
        )}
      </div>
    </div>
  );
};
