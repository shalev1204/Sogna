import React from 'react';

export const NeuralBackground: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: -2,
      background: 'var(--sogna-bg)',
      overflow: 'hidden'
    }}>
      {/* Magical Aurora/Silk Elements */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '60%',
        height: '60%',
        background: 'radial-gradient(ellipse at center, rgba(128, 230, 255, 0.15) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 20s ease-in-out infinite alternate'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '70%',
        height: '70%',
        background: 'radial-gradient(ellipse at center, rgba(255, 179, 230, 0.15) 0%, transparent 70%)',
        filter: 'blur(100px)',
        animation: 'float 25s ease-in-out infinite alternate-reverse'
      }} />

      <div style={{
        position: 'absolute',
        top: '30%',
        left: '20%',
        width: '40%',
        height: '40%',
        background: 'radial-gradient(ellipse at center, rgba(160, 180, 255, 0.1) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float 15s ease-in-out infinite alternate'
      }} />

      <style>
        {`
          @keyframes float {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            33% { transform: translate(5%, 5%) scale(1.1) rotate(5deg); }
            66% { transform: translate(-2%, 8%) scale(0.95) rotate(-2deg); }
            100% { transform: translate(-5%, -5%) scale(1.05) rotate(3deg); }
          }
        `}
      </style>
    </div>
  );
};
