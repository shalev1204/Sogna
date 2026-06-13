import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';

export const ROIMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    tasksAutomated: 142,
    hoursSaved: 35.5,
    valueGenerated: 2150,
  });

  const [history, setHistory] = useState<{ time: number, value: number }[]>(
    Array.from({ length: 20 }).map((_, i) => ({ time: Date.now() - (20 - i) * 5000, value: 2000 + i * 7.5 }))
  );

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const newValue = prev.valueGenerated + (Math.random() > 0.5 ? Math.floor(Math.random() * 20) : 0);
        setHistory(h => [...h.slice(1), { time: Date.now(), value: newValue }]);
        return {
          tasksAutomated: prev.tasksAutomated + (Math.random() > 0.8 ? 1 : 0),
          hoursSaved: prev.hoursSaved + (Math.random() > 0.8 ? 0.25 : 0),
          valueGenerated: newValue,
        };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // D3 Render
  useEffect(() => {
    if (!svgRef.current || history.length === 0) return;
    const svg = d3.select(svgRef.current);
    const width = 180;
    const height = 40;

    svg.selectAll("*").remove(); // Clear previous render

    const x = d3.scaleTime()
      .domain(d3.extent(history, d => d.time) as [number, number])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(history, d => d.value)! * 0.99, d3.max(history, d => d.value)!])
      .range([height, 0]);

    // Define gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "roi-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(0, 219, 110, 0.5)");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(0, 219, 110, 0)");

    const area = d3.area<{ time: number, value: number }>()
      .x(d => x(d.time))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);

    const line = d3.line<{ time: number, value: number }>()
      .x(d => x(d.time))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(history)
      .attr("fill", "url(#roi-gradient)")
      .attr("d", area);

    svg.append("path")
      .datum(history)
      .attr("fill", "none")
      .attr("stroke", "var(--sogna-primary)")
      .attr("stroke-width", 1.5)
      .attr("d", line);

  }, [history]);

  return (
    <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
      <div className="stat-item">
        <span className="font-display" style={{ fontSize: '13px', color: 'var(--sogna-text-muted)', marginBottom: '4px' }}>Tasks Automated</span>
        <AnimatePresence mode="popLayout">
          <motion.span key={metrics.tasksAutomated} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display" style={{ fontSize: '24px', fontWeight: 600, color: 'var(--sogna-text)' }}>
            {metrics.tasksAutomated}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="stat-item">
        <span className="font-display" style={{ fontSize: '13px', color: 'var(--sogna-text-muted)', marginBottom: '4px' }}>Hours Saved</span>
        <AnimatePresence mode="popLayout">
          <motion.span key={metrics.hoursSaved} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display" style={{ fontSize: '24px', fontWeight: 600, color: 'var(--sogna-text)' }}>
            {metrics.hoursSaved.toFixed(1)}h
          </motion.span>
        </AnimatePresence>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--sogna-surface)', padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--sogna-border)' }}>
        <div className="stat-item">
          <span className="font-display" style={{ fontSize: '13px', color: 'var(--sogna-primary)', marginBottom: '4px' }}>Value Generated</span>
          <AnimatePresence mode="popLayout">
            <motion.span key={metrics.valueGenerated} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-gradient" style={{ fontSize: '24px', fontWeight: 700 }}>
              ${metrics.valueGenerated.toLocaleString()}
            </motion.span>
          </AnimatePresence>
        </div>
        <div style={{ width: '180px', height: '40px' }}>
          <svg ref={svgRef} width="180" height="40" style={{ overflow: 'visible' }}></svg>
        </div>
      </div>
    </div>
  );
};
