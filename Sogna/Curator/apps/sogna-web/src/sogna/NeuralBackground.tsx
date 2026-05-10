import React, { useEffect, useRef } from 'react';

/**
 * NeuralBackground - High-Density Deep Field Synaptic Particles
 * Simulates the 4,534 nodes of the Sogna neural architecture.
 */
export const NeuralBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const particleCount = 120; // Increased density for Phase 5

    class Particle {
      x: number;
      y: number;
      z: number; // Added depth
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 2; // Depth layer 0-2
        this.size = (Math.random() * 1.5 + 0.5) * (1 + this.z);
        this.speedX = (Math.random() * 0.4 - 0.2) / (1 + this.z);
        this.speedY = (Math.random() * 0.4 - 0.2) / (1 + this.z);
        this.opacity = (Math.random() * 0.4 + 0.1) / (1 + this.z);
        this.color = Math.random() > 0.8 ? '0, 242, 255' : '112, 0, 255'; // Cyan or Violet
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.shadowBlur = this.z > 1 ? 10 : 0;
        ctx.shadowColor = `rgba(${this.color}, 0.5)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      // Subtle trail effect
      ctx.fillStyle = 'rgba(3, 3, 8, 0.15)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw synaptic web connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            const alpha = (1 - distance / 120) * 0.1;
            const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
            gradient.addColorStop(0, `rgba(${particles[i].color}, ${alpha})`);
            gradient.addColorStop(1, `rgba(${particles[j].color}, ${alpha})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.6, filter: 'contrast(1.2)', zIndex: -1 }}
    />
  );
};
