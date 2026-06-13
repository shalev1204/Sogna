import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SemanticGraphView } from './sogna/SemanticGraphView.js';
import { SwarmMonitor } from './sogna/SwarmMonitor.js';
import { NeuralBackground } from './sogna/NeuralBackground.js';
import { SognaInterface } from './sogna/SognaInterface.js';
import { useEcosystem, EngineStatus } from './hooks/useEcosystem.js';
import { NexusDock } from './sogna/NexusDock.js';
import { ServicePulse } from './sogna/ServicePulse.js';
import { ReflectionView } from './sogna/ReflectionView.js';
import { SynapseFeed } from './sogna/SynapseFeed.js';
import { CortexHeatmap } from './sogna/CortexHeatmap.js';

// --- ICONS ---
const IconTerminal = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
);
const IconShare = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
);
const IconCpu = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>
);
const IconUma = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
);

const IconActivity = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
const IconBook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
);

import { MemoryBrowser } from './sogna/MemoryBrowser.js';
import { CortexEditor } from './sogna/CortexEditor.js';
import { ROIMetrics } from './sogna/business/ROIMetrics.js';
import { ApprovalQueue } from './sogna/business/ApprovalQueue.js';
import { MissionControl } from './sogna/business/MissionControl.js';
import { Omnibar } from './sogna/business/Omnibar.js';

export const App: React.FC = () => {
  const { engines, stats, events } = useEcosystem();
  const [activeView, setActiveView] = useState<'telemetry' | 'graph' | 'swarm' | 'memory' | 'neural'>('telemetry');
  const [nexusView, setNexusView] = useState<'cortex' | 'inspector' | 'uma' | 'reflection'>('cortex');
  const [selectedMemoryPath, setSelectedMemoryPath] = useState<string | undefined>();
  const [contextMode, setContextMode] = useState<'TECH' | 'BUSINESS'>('TECH');

  return (
    <>
      <Omnibar />
      <NeuralBackground />
      <SognaInterface>
        {/* GLOBAL STATS BAR */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel premium-glow"
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '1rem 2rem', 
            marginBottom: '1.5rem',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--sogna-light-border)'
          }}
        >
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
            {contextMode === 'TECH' ? (
              <div style={{ display: 'flex', gap: '3rem' }}>
                <div className="stat-item">
                  <span className="stat-label font-display">Resonance</span>
                  <span className="stat-value font-display">{stats?.resonance || 0}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label font-display">Synapses</span>
                  <span className="stat-value font-display">{stats?.synapses || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label font-display">Latency</span>
                  <span className="stat-value font-display">{stats?.latency || 0}ms</span>
                </div>
              </div>
            ) : (
              <ROIMetrics />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <ServicePulse />
            <div style={{ width: '1px', height: '24px', background: 'var(--sogna-border)' }}></div>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px' }}>
              <button 
                onClick={() => setContextMode('TECH')}
                className={`view-btn ${contextMode === 'TECH' ? 'active' : ''}`}
                style={{ padding: '6px 12px' }}
              >
                Operations
              </button>
              <button 
                onClick={() => setContextMode('BUSINESS')}
                className={`view-btn ${contextMode === 'BUSINESS' ? 'active' : ''}`}
                style={{ padding: '6px 12px' }}
              >
                Business
              </button>
            </div>
          </div>

          <AnimatePresence>
            {contextMode === 'TECH' && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px', overflow: 'hidden' }}
              >
                <button 
                  onClick={() => setActiveView('telemetry')}
                  className={`view-btn ${activeView === 'telemetry' ? 'active' : ''}`}
                >
                  <IconTerminal />
                  <span>Telemetry</span>
                </button>
                <button 
                  onClick={() => setActiveView('neural')}
                  className={`view-btn ${activeView === 'neural' ? 'active' : ''}`}
                >
                  <IconActivity />
                  <span>Neural Stream</span>
                </button>
                <button 
                  onClick={() => setActiveView('graph')}
                  className={`view-btn ${activeView === 'graph' ? 'active' : ''}`}
                >
                  <IconShare />
                  <span>Semantic Graph</span>
                </button>
                <button 
                  onClick={() => setActiveView('memory')}
                  className={`view-btn ${activeView === 'memory' ? 'active' : ''}`}
                >
                  <IconBook />
                  <span>Cortex Memory</span>
                </button>
                <button 
                  onClick={() => setActiveView('swarm')}
                  className={`view-btn ${activeView === 'swarm' ? 'active' : ''}`}
                >
                  <IconCpu />
                  <span>Swarm Monitor</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
          
          <NexusDock activeView={nexusView} onViewChange={setNexusView} />

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              {contextMode === 'BUSINESS' ? (
                <motion.div 
                  key="business"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', flex: 1, width: '100%' }}
                >
                   <MissionControl />
                   <ApprovalQueue />
                </motion.div>
              ) : nexusView === 'cortex' ? (
                <motion.div 
                  key="cortex"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ display: 'grid', gridTemplateColumns: activeView === 'memory' ? '280px 1fr' : '280px 1fr 300px', gap: '1.5rem', flex: 1, width: '100%' }}
                >
                  {/* LEFT ASIDE: EVENTS or MEMORY TREE */}
                  <motion.aside
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="glass-panel neural-border"
                    style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                  >
                    {activeView === 'memory' ? (
                      <MemoryBrowser onFileSelect={setSelectedMemoryPath} selectedPath={selectedMemoryPath} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', overflow: 'hidden', height: '100%' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                          <IconActivity />
                          <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '0.1em', opacity: 0.8 }}>SYSTEM_PULSE</h3>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {events?.map((event: any, i: number) => (
                            <div key={i} className="event-item">
                              <div className="mono" style={{ fontSize: '9px', opacity: 0.3 }}>[{new Date(event.timestamp).toLocaleTimeString()}]</div>
                              <div style={{ fontSize: '11px', fontWeight: 500 }}>{event.message}</div>
                            </div>
                          )) || <div className="mono" style={{ fontSize: '10px', opacity: 0.3 }}>WAITING_FOR_PULSE...</div>}
                        </div>
                      </div>
                    )}
                  </motion.aside>

                  {/* MAIN VIEW */}
                  <AnimatePresence mode="wait">
                    {activeView === 'telemetry' ? (
                      <motion.section 
                        key="telemetry"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-panel"
                        style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
                      >
                        <div className="mono" style={{ flex: 1, overflowY: 'auto', fontSize: '12px', lineHeight: 1.6 }}>
                          <span style={{ color: 'var(--sogna-primary)' }}>[SYSTEM]</span> Initializing neural link...
                          <br />
                          <span style={{ color: 'var(--sogna-primary)' }}>[SYSTEM]</span> Swarm resonance at {stats?.resonance || 0}%.
                          <br />
                          <span style={{ color: 'var(--sogna-primary)' }}>[SYSTEM]</span> Monitoring {engines.length} autonomous agents.
                        </div>
                      </motion.section>
                    ) : activeView === 'graph' ? (
                      <motion.section 
                        key="graph"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                      >
                        <SemanticGraphView onNodeClick={(node) => {
                          if (node.path) {
                            setSelectedMemoryPath(node.path);
                            setActiveView('memory');
                          }
                        }} />
                      </motion.section>
                    ) : activeView === 'memory' ? (
                      <motion.section 
                        key="memory"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="glass-panel premium-glow"
                        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--sogna-panel)' }}
                      >
                        {selectedMemoryPath ? (
                          <CortexEditor filePath={selectedMemoryPath} />
                        ) : (
                          <div className="empty-state">
                            <IconBook />
                            <div className="mono" style={{ fontSize: '12px', marginTop: '1rem' }}>SELECT_MEMORY_FRAGMENT_TO_DECODE</div>
                          </div>
                        )}
                      </motion.section>
                    ) : activeView === 'neural' ? (
                      <motion.section 
                        key="neural"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="glass-panel premium-glow"
                        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0' }}
                      >
                        <SynapseFeed />
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

                  {/* RIGHT ASIDE: SWARM NODES */}
                  {activeView !== 'memory' && (
                    <motion.aside 
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                    >
                      {activeView === 'neural' ? (
                        <>
                          <CortexHeatmap intensity={stats?.resonance || 45} />
                          <ServicePulse />
                        </>
                      ) : (
                        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <IconCpu />
                            <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '0.1em', opacity: 0.8 }}>SWARM_NODES</h3>
                          </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <AnimatePresence>
                            {!engines || engines.length === 0 ? (
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
                    )}
                    </motion.aside>
                  )}
                </motion.div>
              ) : nexusView === 'reflection' ? (
                <motion.div 
                  key="reflection"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ flex: 1, overflow: 'hidden' }}
                >
                  <ReflectionView />
                </motion.div>
              ) : nexusView === 'inspector' ? (
                <motion.div 
                  key="inspector"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel premium-glow neural-border"
                  style={{ flex: 1, overflow: 'hidden', padding: '0.5rem' }}
                >
                  <iframe 
                    src="http://localhost:6274" 
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }} 
                    title="MCP_INSPECTOR"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="uma"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="glass-panel premium-glow"
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                >
                  <IconUma />
                  <div className="text-gradient" style={{ fontSize: '24px', fontWeight: 800, marginTop: '2rem', letterSpacing: '0.2em' }}>UMA_DIAGNOSTIC</div>
                  <div className="mono" style={{ fontSize: '12px', opacity: 0.5, marginTop: '1rem' }}>ENDPOINT: http://localhost:8000</div>
                  
                  <div className="glass-panel" style={{ width: '80%', height: '300px', marginTop: '3rem', padding: '2rem', background: 'rgba(0,0,0,0.2)' }}>
                    <div className="mono" style={{ fontSize: '11px', color: 'var(--sogna-primary)' }}>
                      [UMA_STATUS]: ACTIVE <br/>
                      [VECTOR_DB]: ChromaDB_Loaded <br/>
                      [GRAPH_NODES]: 1,244 <br/>
                      [LAST_SYNC]: {new Date().toLocaleTimeString()} <br/>
                      <br/>
                      --- NEURAL_STREAM --- <br/>
                      {">"} Querying hybrid recall... SUCCESS <br/>
                      {">"} Expansion layer 2: OK <br/>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SognaInterface>
    </>
  );
};
