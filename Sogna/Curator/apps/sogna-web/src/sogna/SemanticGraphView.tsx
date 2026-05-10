import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { sognaBridge } from '../services/TelemetryBridge';

// Custom Minimal Icons to bypass lucide-react resolution issues in Vite 8
const IconShare = () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8m-11-4l3-3 3 3m-3-3v12"/></svg>;
const IconActivity = () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const IconDatabase = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;

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

export const SemanticGraphView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoverNode, setHoverNode] = useState<Node | null>(null);

  useEffect(() => {
    const unsubscribe = sognaBridge.onMessage('GRAPH_DATA', (graph: GraphData) => {
      setData(graph);
    });
    sognaBridge.fetchGraph();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Link>(data.edges).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    const link = container.append('g')
      .selectAll('line')
      .data(data.edges)
      .enter().append('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', d => (d as any).relation === 'enforces' ? '5,5' : 'none');

    const node = container.append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => setSelectedNode(d))
      .on('mouseenter', (_event, d) => setHoverNode(d))
      .on('mouseleave', () => setHoverNode(null))
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    node.append('circle')
      .attr('r', 25)
      .attr('fill', d => getTypeColor(d.type))
      .attr('filter', 'url(#glow)');

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(d => d.label.substring(0, 2).toUpperCase());

    node.append('text')
      .attr('dx', 30)
      .attr('dy', '.35em')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif')
      .text(d => d.label);

    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Identity': return 'rgba(124, 58, 237, 0.6)';
      case 'Rule': return 'rgba(220, 38, 38, 0.6)';
      case 'Design': return 'rgba(245, 158, 11, 0.6)';
      case 'Tool': return 'rgba(5, 150, 105, 0.6)';
      case 'Business': return 'rgba(37, 99, 235, 0.6)';
      default: return 'rgba(107, 114, 128, 0.6)';
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-black/40 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-xl">
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

      <svg ref={svgRef} className="w-full h-full" />

      <AnimatePresence>
        {(selectedNode || hoverNode) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-6 right-6 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-2xl pointer-events-none"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: getTypeColor((selectedNode || hoverNode)!.type) }}>
                  <IconDatabase />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{(selectedNode || hoverNode)!.label}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-white/60 uppercase tracking-tighter">
                      {(selectedNode || hoverNode)!.type}
                    </span>
                    <span className="text-[11px] text-white/30 font-mono">
                      {(selectedNode || hoverNode)!.id}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40 mb-1">LOCALIZACIÓN</p>
                <p className="text-[11px] text-indigo-400 font-mono italic">{(selectedNode || hoverNode)!.path || 'n/a'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 right-6 flex flex-col gap-2 p-3 bg-black/60 border border-white/5 rounded-lg text-[10px] text-white/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          <span>Identidad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Reglas / Protocolos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Herramientas</span>
        </div>
      </div>
    </div>
  );
};
