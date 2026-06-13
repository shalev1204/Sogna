import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sognaBridge } from '../services/TelemetryBridge';

const IconShare = () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8m-11-4l3-3 3 3m-3-3v12"/></svg>;
const IconActivity = () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;

interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  path?: string;
  x?: number;
  y?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  relation: string;
}

interface GraphData {
  nodes: Node[];
  edges: Link[];
}

export const SemanticGraphView: React.FC<{ onNodeClick?: (node: Node) => void }> = ({ onNodeClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [isResonanceActive, setIsResonanceActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulation ref to keep it persistent
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);

  useEffect(() => {
    const unsubscribe = sognaBridge.onMessage('GRAPH_DATA', (graph: GraphData) => {
      if (!graph || !graph.nodes) {
        setError('Invalid graph data received');
        return;
      }
      console.log(`🧠 Recibidos ${graph.nodes.length} nodos. Iniciando simulación...`);
      setData(graph);
      setIsResonanceActive(true);
      setError(null);
    });
    sognaBridge.fetchGraph();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current || !containerRef.current) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    try {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Deep clone to avoid mutating state and ensure D3 has its own objects
      const nodes = data.nodes.map(n => ({ ...n }));
      const links = data.edges.map(l => ({ ...l }));

      const simulation = d3.forceSimulation<Node>(nodes)
        .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-20))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(4));

      simulationRef.current = simulation;

      const draw = (t: d3.ZoomTransform) => {
        try {
          if (!ctx) return;
          ctx.clearRect(0, 0, width, height);
          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.scale(t.k, t.k);

          // Draw Links
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0, 219, 110, 0.1)';
          ctx.lineWidth = 0.5;
          links.forEach(link => {
            const s = link.source as any;
            const target = link.target as any;
            if (s && target && typeof s === 'object' && typeof target === 'object' && 
                typeof s.x === 'number' && typeof s.y === 'number' && typeof target.x === 'number' && typeof target.y === 'number' &&
                isFinite(s.x) && isFinite(s.y) && isFinite(target.x) && isFinite(target.y)) {
              ctx.moveTo(s.x, s.y);
              ctx.lineTo(target.x, target.y);
            }
          });
          ctx.stroke();

          // Draw Traveling Particles
          const time = Date.now() / 1000;
          links.forEach(link => {
            const s = link.source as any;
            const target = link.target as any;
            if (s && target && typeof s === 'object' && typeof target === 'object' && 
                typeof s.x === 'number' && typeof s.y === 'number' && typeof target.x === 'number' && typeof target.y === 'number' &&
                isFinite(s.x) && isFinite(s.y) && isFinite(target.x) && isFinite(target.y)) {
              
              // Base speed and pseudo-random offset
              const speed = 0.3;
              const linkIdStr = (link as any).id || `${s.id}-${target.id}`;
              const offset = (linkIdStr.length % 10) / 10;
              const t = ((time * speed) + offset) % 1;
              
              const px = s.x + (target.x - s.x) * t;
              const py = s.y + (target.y - s.y) * t;
              
              ctx.beginPath();
              ctx.fillStyle = 'rgba(255, 191, 0, 0.9)'; // RAG Gold particles
              ctx.arc(px, py, 1.2, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.shadowBlur = 6;
              ctx.shadowColor = 'rgba(255, 191, 0, 0.8)';
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          });

          // Draw Nodes
          nodes.forEach(node => {
            if (typeof node.x !== 'number' || typeof node.y !== 'number' || !isFinite(node.x) || !isFinite(node.y)) return;
            ctx.beginPath();
            ctx.fillStyle = getTypeColor(node.type);
            const radius = node.type === 'Agent' ? 4 : 1.5;
            ctx.arc(node.x as number, node.y as number, radius, 0, Math.PI * 2);
            ctx.fill();
            
            if (t.k > 2.5 && node.type === 'Agent') {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = '6px Inter';
                ctx.fillText(node.label, (node.x as number) + 6, (node.y as number) + 2);
            }
          });

          ctx.restore();
        } catch (err) {
          console.error('Draw error:', err);
        }
      };

      const zoom = d3.zoom<HTMLCanvasElement, unknown>()
        .scaleExtent([0.05, 10])
        .on('zoom', () => {
          // Handled by the animation loop
        });

      d3.select(canvas).call(zoom as any);

      let animFrameId: number;
      const animateLoop = () => {
        draw(d3.zoomTransform(canvas));
        animFrameId = requestAnimationFrame(animateLoop);
      };
      animateLoop();

      const handleClick = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left);
        const y = (event.clientY - rect.top);
        
        const transform = d3.zoomTransform(canvas);
        const worldX = (x - transform.x) / transform.k;
        const worldY = (y - transform.y) / transform.k;

        const closest = nodes.find(node => {
          if (typeof node.x !== 'number' || typeof node.y !== 'number') return false;
          const dx = node.x - worldX;
          const dy = node.y - worldY;
          const radius = node.type === 'Agent' ? 8 : 4;
          return Math.sqrt(dx*dx + dy*dy) < radius;
        });

        if (closest && onNodeClick) {
          onNodeClick(closest);
        }
      };

      canvas.addEventListener('click', handleClick);

      return () => {
        simulation.stop();
        cancelAnimationFrame(animFrameId);
        canvas.removeEventListener('click', handleClick);
      };
    } catch (err: any) {
      console.error('Simulation setup error:', err);
      setError(err.message);
      return undefined;
    }
  }, [data]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Agent': return '#00db6e'; // Emerald
      case 'Identity': return '#ffbf00'; // RAG Gold
      case 'Rule': return '#ff4d4d'; // Alert Red
      case 'Design': return '#00b359'; // Darker Emerald
      case 'Tool': return '#ffdb4d'; // Lighter Gold
      case 'Business': return '#00994d'; // Deep Green
      default: return '#4d4d4d'; // Matte Gray
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[600px] bg-black/40 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-xl">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <IconShare />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white/90">Grafo Semántico</h3>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Memoria Viva Sogna</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button 
          onClick={() => sognaBridge.fetchGraph()}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
        >
          <IconActivity />
        </button>
      </div>

      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/40 backdrop-blur-md z-30">
          <div className="p-6 bg-black/80 border border-red-500/30 rounded-xl max-w-md text-center">
             <div className="text-red-400 font-mono text-sm mb-2">NEURAL_COLLAPSE_DETECTED</div>
             <div className="text-white/60 text-xs mb-4">{error}</div>
             <button 
               onClick={() => { setError(null); sognaBridge.fetchGraph(); }}
               className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 rounded-lg text-[10px] uppercase tracking-widest transition-all"
             >
               Attempt Recovery
             </button>
          </div>
        </div>
      )}

      {!isResonanceActive && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-20">
          <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
             <div className="mono text-[10px] tracking-widest opacity-50">SYNCHRONIZING_NEURAL_RESONANCE...</div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 right-6 flex flex-col gap-2 p-3 bg-black/60 border border-white/5 rounded-lg text-[10px] text-white/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <span>Agent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Protocolos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Herramientas</span>
        </div>
      </div>
    </div>
  );
};
