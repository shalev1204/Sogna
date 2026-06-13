import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Omnibar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const results = [
    { id: '1', type: 'COMMAND', text: '/deploy swarm-node-04' },
    { id: '2', type: 'MEMORY', text: 'Quarterly_Report_Draft.md' },
    { id: '3', type: 'AGENT', text: 'Configure PREDATORE_CORE' },
    { id: '4', type: 'ACTION', text: 'Pause all autonomous operations' }
  ].filter(r => r.text.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: '15vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
        }} onClick={() => setIsOpen(false)}>
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-panel premium-glow"
            style={{ width: '600px', maxWidth: '90vw', overflow: 'hidden', padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--sogna-border)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sogna-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search memory, dispatch commands, or configure agents..."
                className="mono font-display"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--sogna-text)',
                  fontSize: '14px',
                  outline: 'none',
                  marginLeft: '1rem',
                  letterSpacing: '0.05em'
                }}
              />
              <div className="mono" style={{ fontSize: '10px', opacity: 0.5, border: '1px solid var(--sogna-border)', padding: '2px 6px', borderRadius: '4px' }}>ESC</div>
            </div>

            <div style={{ padding: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
              {results.length > 0 ? results.map((result, i) => (
                <div key={result.id} className="search-result-item" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem 1.5rem', 
                  cursor: 'pointer',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  background: i === 0 && query ? 'rgba(0, 219, 110, 0.05)' : 'transparent',
                  border: i === 0 && query ? '1px solid var(--sogna-light-border)' : '1px solid transparent'
                }}>
                  <span className="mono" style={{ fontSize: '9px', color: 'var(--sogna-secondary)', width: '60px' }}>[{result.type}]</span>
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>{result.text}</span>
                </div>
              )) : (
                <div className="mono" style={{ padding: '2rem', textAlign: 'center', opacity: 0.4, fontSize: '12px' }}>NO_MATCHES_FOUND</div>
              )}
            </div>
            
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--sogna-border)', display: 'flex', justifyContent: 'space-between' }}>
              <div className="mono" style={{ fontSize: '9px', opacity: 0.4 }}>Use ↑↓ to navigate, ↵ to select</div>
              <div className="font-display" style={{ fontSize: '9px', color: 'var(--sogna-primary)' }}>SOGNA_OMNIBAR</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
