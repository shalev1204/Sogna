import * as fs from 'fs';

export interface CanvasNode {
  id: string;
  type: 'file' | 'text' | 'link' | 'group' | 'agent';
  x: number;
  y: number;
  width: number;
  height: number;
  file?: string;
  text?: string;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  label?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * CanvasEngine - Spatial Agent Orchestration.
 */
export class CanvasEngine {
  /**
   * Loads a Universal .canvas file and prepares it for Sognatore.
   */
  async loadCanvas(canvasPath: string): Promise<CanvasData> {
    const data: CanvasData = JSON.parse(fs.readFileSync(canvasPath, 'utf-8'));
    
    // Transform "file" nodes into "agent" nodes if they belong to the toolkit
    data.nodes = data.nodes.map(node => {
      if (node.file && node.file.includes('agents/')) {
        return { ...node, type: 'agent' };
      }
      return node;
    });

    console.log(`[CanvasEngine] Loaded spatial map with ${data.nodes.length} nodes and ${data.edges.length} connections.`);
    return data;
  }

  /**
   * Generates a new Living Canvas based on current system state.
   */
  async autoDiagram(nodes: any[], edges: any[]): Promise<CanvasData> {
    // Basic auto-layout logic (Grid)
    const canvasNodes: CanvasNode[] = nodes.map((n, i) => ({
      id: n.id,
      type: n.type || 'text',
      x: (i % 5) * 300,
      y: Math.floor(i / 5) * 200,
      width: 250,
      height: 150,
      text: n.name || n.id
    }));

    const canvasEdges: CanvasEdge[] = edges.map((e, i) => ({
      id: `edge_${i}`,
      fromNode: e.source,
      toNode: e.target,
      label: e.type
    }));

    return { nodes: canvasNodes, edges: canvasEdges };
  }
}
