import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const SognaInterface: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="sogna-root"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {/* Sogna Header - Minimalist Magical */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 120, damping: 20 }}
        style={{
          margin: '1rem',
          padding: '1rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Minimalist Orca Logo SVG */}
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 20C30 20 20 40 10 40C15 55 25 70 50 80C75 70 85 55 90 40C80 40 70 20 50 20Z" fill="var(--sogna-bg)" stroke="var(--sogna-text)" strokeWidth="3" strokeLinejoin="round"/>
            <path d="M40 15C45 5 55 5 60 15" stroke="var(--sogna-text)" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="65" cy="45" r="4" fill="var(--sogna-primary)" />
            <path d="M15 60C10 70 5 75 5 75C15 80 25 75 30 65" fill="var(--sogna-bg)" stroke="var(--sogna-text)" strokeWidth="3" strokeLinejoin="round"/>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="font-display" style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Sogna
            </div>
            <div className="mono" style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>
              Enterprise OS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '3rem', fontSize: '11px', fontWeight: 500 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ opacity: 0.5, marginBottom: '4px' }}>Identity</span>
            <span style={{ color: 'var(--sogna-primary)' }}>Master SSOT</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ opacity: 0.5, marginBottom: '4px' }}>Status</span>
            <span style={{ color: 'var(--sogna-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="status-indicator status-online" style={{ width: '6px', height: '6px', boxShadow: '0 0 10px var(--sogna-success)' }}></div>
              Synchronized
            </span>
          </div>
        </div>
      </motion.header>

      <main
        style={{
          flex: 1,
          padding: '0 1rem 1rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
        }}
      >
        {children}
      </main>

      {/* Footer Status Bar - Soft & Clean */}
      <motion.footer
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
        style={{
          margin: '0 1rem 1rem 1rem',
          padding: '1rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          background: 'var(--sogna-surface)',
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--sogna-border)'
        }}
      >
        <div className="mono" style={{ fontSize: '10px', opacity: 0.5 }}>
          Idle &middot; Listening for pulse...
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div className="mono" style={{ fontSize: '10px', opacity: 0.4 }}>
            {time.toLocaleTimeString()}
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--sogna-primary)', opacity: 0.8 }}>
            Dream State Active
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
};
