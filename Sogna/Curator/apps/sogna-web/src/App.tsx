import { SemanticGraphView } from './sogna/SemanticGraphView.js';
import { SwarmMonitor } from './sogna/SwarmMonitor.js';
import { useEcosystem } from './hooks/useEcosystem.js';

// ... (iconos omitidos por brevedad en el contexto de replace)

export const App: React.FC = () => {
  const { engines, stats, events, connectionStatus, sendPanic } = useEcosystem();
  const [activeView, setActiveView] = useState<'telemetry' | 'graph' | 'swarm'>('telemetry');

  return (
    <SognaInterface>
      {/* GLOBAL STATS BAR */}
      <motion.div 
        // ... (props omitidos)
      >
        {/* ... (stats omitidos) */}

        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px' }}>
          <button 
            onClick={() => setActiveView('telemetry')}
            className={`view-btn ${activeView === 'telemetry' ? 'active' : ''}`}
          >
            <IconTerminal />
            <span>TELEMETRY</span>
          </button>
          <button 
            onClick={() => setActiveView('graph')}
            className={`view-btn ${activeView === 'graph' ? 'active' : ''}`}
          >
            <IconShare />
            <span>SEMANTIC_GRAPH</span>
          </button>
          <button 
            onClick={() => setActiveView('swarm')}
            className={`view-btn ${activeView === 'swarm' ? 'active' : ''}`}
          >
            <IconCpu />
            <span>SWARM_MONITOR</span>
          </button>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: '1.5rem', flex: 1, height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
        
        {/* ... (aside izquierdo omitido) */}

        <AnimatePresence mode="wait">
          {activeView === 'telemetry' ? (
            // ... (telemetry section)
          ) : activeView === 'graph' ? (
            <motion.section 
              key="graph"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <SemanticGraphView />
            </motion.section>
          ) : (
            <motion.section 
              key="swarm"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <SwarmMonitor />
            </motion.section>
          )}
        </AnimatePresence>

        <motion.aside 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <IconCpu />
              <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '0.1em', opacity: 0.8 }}>SWARM_NODES</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AnimatePresence>
                {engines.length === 0 ? (
                  <div className="mono empty-scanning">
                    SCANNING_FOR_ENGINES...
                  </div>
                ) : (
                  engines.map((engine: EngineStatus) => (
                    <motion.div 
                      key={engine.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="engine-card"
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700 }}>{engine.name.toUpperCase()}</div>
                        <div className="mono" style={{ fontSize: '8px', opacity: 0.4 }}>PULSES: {engine.messageCount}</div>
                      </div>
                      <div className={`engine-badge engine-badge-${engine.status}`}>
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
