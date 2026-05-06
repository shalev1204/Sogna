import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ThemeProvider, useTheme, SwarmType } from './ThemeContext.js';
import './App.css.js';

function AppContent() {
  const { swarm, setSwarm, theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [health, setHealth] = useState({ status: 'HEALTHY', nodes: 97, edges: 842, alerts: 0 });

  const swarms: SwarmType[] = ['orchestration', 'security', 'execution', 'memory'];

  return (
    <div className="app-container">
      <nav className="swarm-nav">
        <div className="system-pulse" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: '0 20px',
          color: health.status === 'HEALTHY' ? '#10b981' : '#f59e0b'
        }}>
          <div className="pulse-dot" style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            backgroundColor: 'currentColor',
            boxShadow: `0 0 10px currentColor`
          }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{health.status} ({health.alerts} ALERTS)</span>
        </div>
        {swarms.map((s) => (
          <button 
            key={s} 
            onClick={() => setSwarm(s)}
            className={`nav-item ${swarm === s ? 'active' : ''}`}
            style={{ borderColor: swarm === s ? theme.primary : 'transparent' }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </nav>

      <header className="hero-section">
        <AnimatePresence mode="wait">
          <motion.div 
            key={swarm}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="hero-content"
          >
            <h1 className="title-gradient">Sognatore</h1>
            <p className="subtitle">
              Current Swarm: <span style={{ color: theme.primary, fontWeight: 'bold' }}>{swarm.toUpperCase()}</span>
              <br />
              Adaptive Intelligence for the Sovereign Developer.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="cta-button"
            >
              Initialize {swarm}
              {isHovered && (
                <motion.span 
                  layoutId="underline"
                  className="button-glow"
                />
              )}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </header>

      <main className="features-grid">
        <FeatureCard 
          title="Neural Mapping" 
          desc={`${health.nodes} Nodes | ${health.edges} Connections active.`} 
          icon="🕸️" 
        />
        <FeatureCard 
          title="Reactive Skins" 
          desc="UI adapts in real-time to the active swarm's specialty and mood." 
          icon="🎨" 
        />
        <FeatureCard 
          title="Proactive Immune" 
          desc="Continuous integrity scanning. 1 issue found: Orphaned Agent." 
          icon="🛡️" 
        />
      </main>

      <section className="neural-map-preview">
        <div className="glass-panel" style={{ borderLeft: `4px solid ${health.status === 'HEALTHY' ? theme.primary : '#f59e0b'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Neural Health Center</h3>
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Last Evolution: Just now</span>
          </div>
          <div className="health-alert">
            <p>🚨 <strong>Integrity Alert:</strong> Agent <code>Test de Bloques</code> has no connections.</p>
            <button className="fix-btn" style={{ 
              backgroundColor: theme.primary, 
              color: '#fff', 
              border: 'none', 
              padding: '5px 15px', 
              borderRadius: '20px', 
              cursor: 'pointer',
              marginTop: '10px'
            }}>Repair Network</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
      className="feature-card"
    >
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
