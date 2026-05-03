import React from 'react';
import { SognaInterface } from './sogna/sognainterface';
import { SognaTimeline } from './sogna/sognatimeline';
import { SognaToolRow } from './sogna/sognatoolrow';
import { useTelemetry } from './hooks/usetelemetry';

export const App: React.FC = () => {
  const { events, status, sendPanic } = useTelemetry();

  return (
    <SognaInterface>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2>Sogna Dashboard</h2>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: status === 'connected' ? '#10b981' : (status === 'connecting' ? '#f59e0b' : '#ef4444'),
            boxShadow: status === 'connected' ? '0 0 8px #10b981' : 'none'
          }} />
          <span style={{ fontSize: '12px', opacity: 0.7 }}>
            {status === 'connected' ? 'Sognatore Online' : 'Sognatore Offline'}
          </span>
        </div>
        
        <button 
          onClick={sendPanic}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: status === 'connected' ? 'pointer' : 'not-allowed',
            opacity: status === 'connected' ? 1 : 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}
          disabled={status !== 'connected'}
        >
          🚨 PANIC BUTTON (PAUSE)
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 150px)' }}>
        {/* Panel Principal: Telemetría / Eventos */}
        <div style={{ flex: 2, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--sogna-border)' }}>
          <h3 style={{ marginTop: 0, opacity: 0.8 }}>Live Telemetry Stream</h3>
          <SognaTimeline>
            {events.length === 0 ? (
              <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '2rem' }}>Waiting for Sognatore pulses...</div>
            ) : (
              events.map((evt, idx) => {
                // Mapear eventos del SognaEventBus a props de SognaToolRow
                let rowStatus: 'thinking' | 'executing' | 'completed' | 'error' = 'executing';
                if (evt.type === 'ERROR') rowStatus = 'error';
                else if (evt.type === 'END' || evt.type === 'COMPLETED') rowStatus = 'completed';
                else if (evt.type === 'START') rowStatus = 'thinking';

                return (
                  <SognaToolRow 
                    key={idx}
                    toolName={evt.emitter}
                    status={rowStatus}
                    detail={`[${evt.provenance}] ${evt.type}`}
                    result={evt.data?.message || JSON.stringify(evt.data)}
                  />
                );
              })
            )}
          </SognaTimeline>
        </div>
        
        {/* Panel Lateral: Estado / Sentinel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--sogna-border)' }}>
            <h3 style={{ marginTop: 0, opacity: 0.8 }}>Sentinel (Security Gate)</h3>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>
              <p>Active Policies: <strong>STRICT</strong></p>
              <p>Blocked Actions: <strong>0</strong></p>
              <p>System Trust: <strong>100%</strong></p>
            </div>
            {/* Aquí se podrían añadir más componentes visuales para Sentinel */}
          </div>
          
          <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--sogna-border)' }}>
            <h3 style={{ marginTop: 0, opacity: 0.8 }}>Active Swarms</h3>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>
              <ul>
                <li><strong>Operations</strong>: Idle</li>
                <li><strong>Assembler</strong>: Idle</li>
                <li><strong>Studio</strong>: Idle</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SognaInterface>
  );
};
