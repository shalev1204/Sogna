import React, { useRef, useEffect } from 'react';

/**
 * SognaTimeline
 * El corazón del AgentIQI.
 * Gestiona la secuencia de pasos de razonamiento y herramientas.
 */
export const SognaTimeline: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Joya Oculta: Auto-scroll institucional
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <div 
      ref={scrollRef}
      className="sogna-timeline"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--sogna-density) * 1.5rem)',
        overflowY: 'auto',
        maxHeight: '100%',
        paddingBottom: '2rem'
      }}
    >
      {children}
    </div>
  );
};
