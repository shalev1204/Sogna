import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface CortexHeatmapProps {
  intensity?: number;
}

/**
 * CortexHeatmap — Córtex Holográfico: Radial Sonar Brain Scanner
 * Animated concentric waves reacting to swarm RESONANCE metric.
 */
export const CortexHeatmap: React.FC<CortexHeatmapProps> = ({ intensity = 45 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animId: number;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    let phase = 0;

    const draw = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.42;

      ctx.clearRect(0, 0, w, h);

      // Concentric rings
      const ringCount = 5;
      for (let i = 0; i < ringCount; i++) {
        const r = maxR * ((i + 1) / ringCount);
        const alpha = 0.06 + (i / ringCount) * 0.04;
        ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Sweeping radar line
      const sweepAngle = phase;
      const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
      grad.addColorStop(0, 'rgba(0, 242, 255, 0.5)');
      grad.addColorStop(1, 'rgba(0, 242, 255, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
      ctx.stroke();

      // Sweep trail arc
      ctx.fillStyle = 'rgba(0, 242, 255, 0.03)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, sweepAngle - 0.8, sweepAngle);
      ctx.closePath();
      ctx.fill();

      // Neural activity dots
      const normalizedIntensity = intensity / 100;
      const dotCount = Math.floor(12 + normalizedIntensity * 20);
      for (let i = 0; i < dotCount; i++) {
        const angle = (i / dotCount) * Math.PI * 2 + phase * 0.1;
        const r = maxR * (0.2 + Math.random() * 0.7);
        const dx = cx + Math.cos(angle) * r;
        const dy = cy + Math.sin(angle) * r;
        const dotAlpha = 0.15 + normalizedIntensity * Math.random() * 0.6;
        const dotSize = 1 + normalizedIntensity * Math.random() * 2.5;

        const angleDiff = Math.abs(((angle - sweepAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
        const brightnessMul = angleDiff < 0.8 ? 1 + (0.8 - angleDiff) * 2 : 1;

        ctx.fillStyle = normalizedIntensity > 0.7
          ? `rgba(0, 255, 163, ${dotAlpha * brightnessMul})`
          : `rgba(0, 242, 255, ${dotAlpha * brightnessMul})`;
        ctx.beginPath();
        ctx.arc(dx, dy, dotSize, 0, Math.PI * 2);
        ctx.fill();

        if (brightnessMul > 1.5) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(0, 242, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(dx, dy, dotSize * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Center core
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
      coreGrad.addColorStop(0, `rgba(0, 242, 255, ${0.3 + normalizedIntensity * 0.4})`);
      coreGrad.addColorStop(1, 'rgba(0, 242, 255, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + normalizedIntensity * 0.4})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      phase += 0.015 + normalizedIntensity * 0.01;
      animId = requestAnimationFrame(draw);
    };

    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [intensity]);

  return (
    <div
      className="glass-panel premium-glow"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        background: 'radial-gradient(circle at center, rgba(0,242,255,0.03) 0%, transparent 70%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="text-gradient font-display" style={{ margin: 0, fontSize: '11px', letterSpacing: '0.2em' }}>
          CORTEX_SONAR
        </h3>
        <span className="mono" style={{ fontSize: '10px', opacity: 0.5 }}>
          RESONANCE: {intensity}%
        </span>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <motion.div
          className="glass-panel"
          whileHover={{ scale: 1.02 }}
          style={{ padding: '0.6rem', fontSize: '10px' }}
        >
          <div className="font-display" style={{ opacity: 0.4, marginBottom: '0.2rem', fontSize: '8px', letterSpacing: '0.1em' }}>
            ACTIVE_CLUSTERS
          </div>
          <div className="mono text-gradient" style={{ fontSize: '14px' }}>
            {Math.floor(intensity * 1.2)}
          </div>
        </motion.div>
        <motion.div
          className="glass-panel"
          whileHover={{ scale: 1.02 }}
          style={{ padding: '0.6rem', fontSize: '10px' }}
        >
          <div className="font-display" style={{ opacity: 0.4, marginBottom: '0.2rem', fontSize: '8px', letterSpacing: '0.1em' }}>
            SYNAPTIC_LOAD
          </div>
          <div className="mono" style={{ fontSize: '14px' }}>
            {(intensity * 0.08).toFixed(2)} TB/s
          </div>
        </motion.div>
      </div>
    </div>
  );
};
