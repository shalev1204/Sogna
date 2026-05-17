import React from 'react';
import { motion } from 'framer-motion';

interface NexusDockProps {
  activeView: string;
  onViewChange: (view: any) => void;
}

const IconCortex = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);

const IconInspector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);

const IconUma = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
);

const IconReflect = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 12L2.7 7.3"></path><path d="M12 12l9.3-4.7"></path><path d="M12 12v10"></path></svg>
);

export const NexusDock: React.FC<NexusDockProps> = ({ activeView, onViewChange }) => {
  const items = [
    { id: 'cortex', label: 'CORTEX', icon: <IconCortex /> },
    { id: 'reflection', label: 'REFLECT', icon: <IconReflect /> },
    { id: 'inspector', label: 'INSPECTOR', icon: <IconInspector /> },
    { id: 'uma', label: 'UMA_NODE', icon: <IconUma /> },
  ];

  return (
    <div className="glass-panel neural-border nexus-dock" style={{ 
      width: '72px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '2rem', 
      padding: '2.5rem 0',
      background: 'rgba(255,255,255,0.01)',
      backdropFilter: 'blur(20px)',
      borderRadius: '32px',
      boxShadow: 'inset 0 0 20px rgba(0, 242, 255, 0.05)'
    }}>
      {items.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onViewChange(item.id)}
          style={{
            background: 'none',
            border: 'none',
            color: activeView === item.id ? 'var(--sogna-primary)' : 'rgba(255,255,255,0.25)',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            transition: 'color 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
          }}
        >
          <div style={{
            padding: '12px',
            borderRadius: '16px',
            background: activeView === item.id ? 'rgba(0, 242, 255, 0.08)' : 'transparent',
            boxShadow: activeView === item.id ? '0 0 20px rgba(0, 242, 255, 0.1)' : 'none',
            transition: 'all 0.4s ease'
          }}>
            {item.icon}
          </div>
          <span className="mono" style={{ 
            fontSize: '8px', 
            fontWeight: 800, 
            letterSpacing: '0.15em',
            opacity: activeView === item.id ? 1 : 0.4,
            textShadow: activeView === item.id ? '0 0 10px var(--sogna-primary-glow)' : 'none'
          }}>
            {item.label}
          </span>
          
          {activeView === item.id && (
            <motion.div 
              layoutId="dock-glow"
              className="premium-glow"
              style={{ 
                position: 'absolute', 
                zIndex: -1,
                width: '100%',
                height: '100%',
                filter: 'blur(15px)',
                opacity: 0.15
              }} 
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};
