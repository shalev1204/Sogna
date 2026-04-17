import { motion } from 'framer-motion';
import { useState } from 'react';
import './App.css';

function App() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="app-container">
      <header className="hero-section">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-content"
        >
          <h1 className="title-gradient">Unicorn</h1>
          <p className="subtitle">Born from the Sognatore Forge. Autonomous. Powerful. Yours.</p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="cta-button"
          >
            Explore Intelligence
            {isHovered && (
              <motion.span 
                layoutId="underline"
                className="button-glow"
              />
            )}
          </motion.button>
        </motion.div>
      </header>

      <main className="features-grid">
        <FeatureCard title="Omniscience" desc="Integrated real-time search and external agent delegation." icon="👁️" />
        <FeatureCard title="Sovereignty" desc="Full physical copies and isolated identity management." icon="🛡️" />
        <FeatureCard title="Automation" desc="Seamless n8n and Supabase cloud synchronization." icon="⚡" />
      </main>
    </div>
  );
}

function FeatureCard({ title, desc, icon }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="feature-card"
    >
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.div>
  );
}

export default App;
