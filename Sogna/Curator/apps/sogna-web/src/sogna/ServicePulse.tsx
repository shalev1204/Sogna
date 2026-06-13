import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ServiceStatus {
  name: string;
  port: number;
  online: boolean;
}

/**
 * ServicePulse — Córtex Holográfico: Premium Service Health Indicators
 */
export const ServicePulse: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'UMA_SERVER', port: 8000, online: false },
    { name: 'MCP_INSPECTOR', port: 6274, online: false },
    { name: 'TELEMETRY_BRIDGE', port: 4000, online: false },
  ]);

  const checkServices = async () => {
    const updated = await Promise.all(
      services.map(async (s) => {
        try {
          await fetch(`http://localhost:${s.port}`, { mode: 'no-cors' });
          return { ...s, online: true };
        } catch {
          return { ...s, online: false };
        }
      })
    );
    setServices(updated);
  };

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        gap: '1.25rem',
        alignItems: 'center',
        padding: '0.5rem 1.5rem',
        borderRadius: '100px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {services.map((s) => (
        <motion.div
          key={s.name}
          whileHover={{ scale: 1.05 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default' }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer pulse ring */}
            <motion.div
              animate={{
                scale: s.online ? [1, 1.8, 1] : 1,
                opacity: s.online ? [0.3, 0, 0.3] : 0.1,
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: s.online ? 'var(--sogna-success)' : 'var(--sogna-error)',
              }}
            />
            {/* Inner dot */}
            <motion.div
              animate={{
                opacity: s.online ? [0.7, 1, 0.7] : 0.4,
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: s.online ? 'var(--sogna-success)' : 'var(--sogna-error)',
                boxShadow: s.online ? '0 0 12px var(--sogna-success-glow)' : 'none',
                zIndex: 2,
              }}
            />
          </div>
          <span
            className="font-display"
            style={{
              fontSize: '8px',
              fontWeight: 700,
              opacity: s.online ? 0.8 : 0.3,
              letterSpacing: '0.08em',
            }}
          >
            {s.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
