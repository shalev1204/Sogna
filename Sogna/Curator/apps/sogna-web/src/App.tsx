import React from 'react';
import { SognaInterface } from './sogna/SognaInterface.js';
import { SognaTimeline } from './sogna/SognaTimeline.js';
import { SognaToolRow } from './sogna/SognaToolRow.js';
import { useEcosystem } from './hooks/useEcosystem.js';
import type { TelemetryEvent } from './hooks/useTelemetry.js';
import type { EngineStatus } from './hooks/useEcosystem.js';
import { motion, AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  const { engines, stats, events, connectionStatus, sendPanic } = useEcosystem();

  return (
    <SognaInterface>
      {/* GLOBAL STATS BAR */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ 
          display: 'flex', 
          gap: '2rem', 
          marginBottom: '1.5rem', 
          padding: '0.5rem 1.5rem',
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.05)',
          fontSize: '11px'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
<span style={{ opacity: 0.4 }}>ACTIVE_ENGINES:</span>
          <span style={{ color: 'var(--sogna-primary)', fontWeight: 800 }}>{stats.activeEngines}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ opacity: 0.4 }}>THROUGHPUT:</span>
          <span className="mono">{stats.eventThroughput} MSG/BUFF</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ opacity: 0.4 }}>ANOMALIES:</span>
          <span style={{ color: stats.errorCount > 0 ? 'var(--sogna-error)' : 'var(--sogna-success)', fontWeight: 800 }}>
            {stats.errorCount}
          </span>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: '1.5rem', flex: 1, height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
        
        {/* SIDEBAR LEFT: SECURITY & SYSTEM */}
        <motion.aside 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* System Integrity Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '14px', letterSpacing: '0.1em', opacity: 0.8 }}>SYSTEM_INTEGRITY</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className={`status-indicator ${connectionStatus === 'connected' ? 'status-online' : ''}`} style={{ width: '12px', height: '12px' }} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{connectionStatus.toUpperCase()}</div>
                <div style={{ fontSize: '10px', opacity: 0.4 }}>NODE_ID: SOGNA_MISSION_CONTROL</div>
              </div>
            </div>
            
            <button 
              onClick={sendPanic}
              className="mono"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                color: 'var(--sogna-error)',
                border: '1px solid var(--sogna-error)',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              TERMINATE_ALL_PROCESSES
            </button>
          </div>

          {/* Sentinel Security Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '0.1em', opacity: 0.8 }}>SENTINEL_GATE</h3>
              <span style={{ fontSize: '10px', color: 'var(--sogna-primary)', fontWeight: 800 }}>ACTIVE</span>
            </div>
            <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '11px' }}>
              <div>
                <div style={{ opacity: 0.4, marginBottom: '0.25rem' }}>TRUST_LEVEL</div>
                <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} style={{ height: '100%', backgroundColor: 'var(--sogna-success)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.4 }}>GOVERNANCE</span>
                <span style={{ color: 'var(--sogna-primary)' }}>ENFORCED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.4 }}>POLICIES</span>
                <span style={{ color: 'var(--sogna-error)' }}>STRICT</span>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* MAIN: TELEMETRY STREAM */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-panel" 
          style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '0.1em', opacity: 0.8 }}>LIVE_TELEMETRY_LOG</h3>
            <div className="mono" style={{ fontSize: '10px', opacity: 0.3 }}>STREAMING_FROM_CORE</div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            <SognaTimeline>
              {events.length === 0 ? (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  opacity: 0.2
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⚡</div>
                  <div className="mono" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>WAITING_FOR_DATA_PULSE...</div>
                </div>
              ) : (
                events.map((evt: TelemetryEvent, idx: number) => (
                  <SognaToolRow 
                    key={`${evt.timestamp}-${idx}`}
                    toolName={evt.emitter}
                    status={evt.type === 'ERROR' ? 'error' : evt.type === 'START' ? 'thinking' : 'executing'}
                    detail={`[${evt.provenance}]`}
                    result={evt.data?.message || (typeof evt.data === 'string' ? evt.data : JSON.stringify(evt.data))}
                  />
                ))
              )}
            </SognaTimeline>
          </div>
        </motion.section>

{/* SIDEBAR RIGHT: SWARMS & ENGINES */}
        <motion.aside 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
<h3 style={{ margin: '0 0 1.5rem 0', fontSize: '14px', letterSpacing: '0.1em', opacity: 0.8 }}>ACTIVE_ENGINES</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AnimatePresence>
                {engines.length === 0 ? (
                  <div className="mono" style={{ fontSize: '10px', opacity: 0.3, textAlign: 'center', marginTop: '2rem' }}>
SCANNING_FOR_ENGINES...
                  </div>
                ) : (
                  engines.map((engine: EngineStatus) => (
                    <motion.div 
key={engine.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      style={{ 
                        padding: '1rem', 
                        backgroundColor: 'rgba(255,255,255,0.02)', 
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
<div style={{ fontSize: '11px', fontWeight: 700 }}>{engine.name}</div>
                        <div className="mono" style={{ fontSize: '8px', opacity: 0.4 }}>PULSES: {engine.messageCount}</div>
                      </div>
                      <div className="mono" style={{ 
                        fontSize: '9px', 
                        color: engine.status === 'active' ? 'var(--sogna-primary)' : 
                               engine.status === 'error' ? 'var(--sogna-error)' : 
                               'var(--sogna-text-muted)',
                        backgroundColor: engine.status === 'active' ? 'rgba(0,255,255,0.1)' : 'transparent',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 800
                      }}>
                        {engine.status.toUpperCase()}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>

      </div>
    </SognaInterface>
  );
};
