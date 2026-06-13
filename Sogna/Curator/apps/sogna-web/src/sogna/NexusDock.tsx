import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

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

/**
 * NexusDock — Córtex Holográfico: Magnetic Lens Dock
 * macOS-inspired magnetic scaling with holographic tooltips.
 */
export const NexusDock: React.FC<NexusDockProps> = ({ activeView, onViewChange }) => {
  const items = [
    { id: 'cortex', label: 'CORTEX', icon: <IconCortex /> },
    { id: 'reflection', label: 'REFLECT', icon: <IconReflect /> },
    { id: 'inspector', label: 'INSPECTOR', icon: <IconInspector /> },
    { id: 'uma', label: 'UMA_NODE', icon: <IconUma /> },
  ];

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const mouseY = useMotionValue(0);
  const dockRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      mouseY.set(e.clientY - rect.top);
    }
  };

  return (
    <motion.div
      ref={dockRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseY.set(-1000); setHoveredId(null); }}
      className="glass-panel neural-border"
      style={{
        width: '76px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '2rem 0',
        background: 'rgba(255,255,255,0.01)',
        backdropFilter: 'blur(20px)',
        borderRadius: '28px',
        boxShadow: 'inset 0 0 20px rgba(0, 242, 255, 0.04)',
      }}
    >
      {items.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.2, y: -3 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => onViewChange(item.id)}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
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
            transition: 'color 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          <motion.div
            animate={{
              background: activeView === item.id ? 'rgba(0, 242, 255, 0.1)' : 'transparent',
              boxShadow: activeView === item.id ? '0 0 25px rgba(0, 242, 255, 0.12)' : 'none',
            }}
            style={{
              padding: '12px',
              borderRadius: '14px',
              transition: 'all 0.4s ease',
            }}
          >
            {item.icon}
          </motion.div>

          <span
            className="font-display"
            style={{
              fontSize: '7px',
              fontWeight: 800,
              letterSpacing: '0.15em',
              opacity: activeView === item.id ? 1 : 0.4,
              textShadow: activeView === item.id ? '0 0 10px var(--sogna-primary-glow)' : 'none',
            }}
          >
            {item.label}
          </span>

          {/* Holographic tooltip */}
          {hoveredId === item.id && activeView !== item.id && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                left: '100%',
                marginLeft: '12px',
                padding: '6px 14px',
                background: 'rgba(0, 242, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0, 242, 255, 0.2)',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 100,
              }}
            >
              <span className="font-display" style={{ fontSize: '9px', color: 'var(--sogna-primary)', letterSpacing: '0.1em' }}>
                {item.label}
              </span>
            </motion.div>
          )}

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
                opacity: 0.15,
              }}
            />
          )}
        </motion.button>
      ))}
    </motion.div>
  );
};
