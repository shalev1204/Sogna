import React, { createContext, useContext, useState, useEffect } from 'react';

export type SwarmType = 'orchestration' | 'security' | 'execution' | 'memory';

interface Theme {
  primary: string;
  secondary: string;
  background: string;
  accent: string;
  blur: string;
  font: string;
}

interface ThemeContextType {
  swarm: SwarmType;
  theme: Theme;
  setSwarm: (swarm: SwarmType) => void;
}

const themes: Record<SwarmType, Theme> = {
  orchestration: {
    primary: "#FFD700",
    secondary: "#1E90FF",
    background: "rgba(10, 10, 20, 0.8)",
    accent: "rgba(255, 215, 0, 0.2)",
    blur: "20px",
    font: "Outfit, sans-serif"
  },
  security: {
    primary: "#FF4500",
    secondary: "#000000",
    background: "rgba(20, 0, 0, 0.9)",
    accent: "rgba(255, 69, 0, 0.1)",
    blur: "10px",
    font: "JetBrains Mono, monospace"
  },
  execution: {
    primary: "#00FF41",
    secondary: "#0D0D0D",
    background: "rgba(0, 10, 0, 0.95)",
    accent: "rgba(0, 255, 65, 0.15)",
    blur: "5px",
    font: "Fira Code, monospace"
  },
  memory: {
    primary: "#9370DB",
    secondary: "#4B0082",
    background: "rgba(15, 0, 30, 0.85)",
    accent: "rgba(147, 112, 219, 0.25)",
    blur: "30px",
    font: "Inter, sans-serif"
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [swarm, setSwarm] = useState<SwarmType>('orchestration');
  const [theme, setTheme] = useState<Theme>(themes[swarm]);

  useEffect(() => {
    setTheme(themes[swarm]);
    // Inject CSS variables to root
    const root = document.documentElement;
    const currentTheme = themes[swarm];
    root.style.setProperty('--primary', currentTheme.primary);
    root.style.setProperty('--secondary', currentTheme.secondary);
    root.style.setProperty('--bg-glass', currentTheme.background);
    root.style.setProperty('--accent', currentTheme.accent);
    root.style.setProperty('--blur-strength', currentTheme.blur);
    root.style.setProperty('--swarm-font', currentTheme.font);
  }, [swarm]);

  return (
    <ThemeContext.Provider value={{ swarm, theme, setSwarm }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
