import fs from 'fs-extra';
import path from 'path';
import { Chronicler, KnowledgeFragment } from './Chronicler.js';
import { ImmuneSystem, HealthReport } from './ImmuneSystem.js';
import { NeuralLearning } from './NeuralLearning.js';

export interface MemoryResult {
  source: 'identity' | 'episodic' | 'immunological' | 'audit' | 'operational';
  key: string;
  content: string;
  relevance: number;
  metadata?: any;
}

/**
 * Sogna Memory Hub (UMA)
 * The central nexo connecting all institutional and episodic memory layers.
 */
export class MemoryHub {
  private static instance: MemoryHub;
  private chronicler: Chronicler;
  private rootMemory: string;
  private securityDir: string;
  private agencyDir: string;
  private registryPath: string;
  private registry: any = null;
  private cache: Map<string, { content: string, mtime: number }> = new Map();
  private immuneSystem: ImmuneSystem;
  private neuralLearning: NeuralLearning;
  private graphCache: { nodes: any[], edges: any[] } | null = null;
  private lastGraphUpdate: number = 0;
  private readonly GRAPH_CACHE_TTL = 30000; // 30 seconds
  private semanticCache: Map<string, { results: any[], timestamp: number }> = new Map();
  private readonly SEMANTIC_CACHE_TTL = 180000; // 3 minutes

  public constructor(rootMemory?: string, chronicler?: Chronicler) {
    const findRoot = (start: string): string => {
      let curr = start;
      const root = path.parse(curr).root;
      while (curr !== root) {
        if (fs.existsSync(path.join(curr, 'package.json')) && (fs.existsSync(path.join(curr, '.git')) || fs.existsSync(path.join(curr, 'Sognatore')))) {
          return curr;
        }
        curr = path.join(curr, '..');
      }
      return process.cwd();
    };

    const projectRoot = findRoot(process.cwd());
    this.rootMemory = rootMemory ? path.resolve(rootMemory) : path.resolve(projectRoot, 'memory');
    this.securityDir = path.join(this.rootMemory, 'security');
    this.agencyDir = path.resolve(projectRoot, 'toolkit/agents'); 
    const skillsDir = path.resolve(projectRoot, 'toolkit/skills'); 
    const sentinelDir = path.resolve(projectRoot, 'toolkit/engines/Sentinel');
    const predatorDir = path.resolve(projectRoot, 'toolkit/engines/Predatore');
    
    this.registryPath = path.join(this.rootMemory, 'registry.json');
    this.chronicler = chronicler || Chronicler.getInstance(projectRoot);
    
    // Global Neural Sources
    this.chronicler.addSource(this.agencyDir); 
    this.chronicler.addSource(skillsDir); 
    this.chronicler.addSource(sentinelDir);
    this.chronicler.addSource(predatorDir);
    this.chronicler.addSource(projectRoot); 

    this.immuneSystem = new ImmuneSystem(this);
    this.neuralLearning = new NeuralLearning(this.chronicler);
  }


  public static getInstance(): MemoryHub {
    if (!MemoryHub.instance) {
      MemoryHub.instance = new MemoryHub();
    }
    return MemoryHub.instance;
  }

  /**
   * Performs a cross-layer memory search with weighted relevance.
   */
  async unifiedRecall(query: string): Promise<MemoryResult[]> {
    const cacheKey = `unified:${query.toLowerCase().trim()}`;
    const now = Date.now();
    const cached = this.semanticCache.get(cacheKey);

    if (cached && (now - cached.timestamp < this.SEMANTIC_CACHE_TTL)) {
      return cached.results;
    }

    await this.ensureRegistry();
    const results: MemoryResult[] = [];

    // 1. Recall Identity Memory (Priority 1.0)
    const identityHits = await this.recallIdentity(query);
    results.push(...identityHits);

    // 2. PROACTIVE NEURAL DECOYS: Check for "Trap Concepts"
    const trapConcepts = ['password', 'secret', 'bypass', 'root', 'admin', 'auth_token', 'private_key'];
    const lowerQuery = query.toLowerCase();
    if (trapConcepts.some(trap => lowerQuery.includes(trap))) {
      const hub = (await import('../../Sentinel-Sognatore/Hub.js')).Hub.getInstance();
      
      // Apex Hardening: Trigger Auto-Panic if the attempt is highly critical
      const criticality = this.evaluateSemanticCriticality(query);
      if (criticality > 0.8) {
          hub.reportIntel('CRITICAL', `BLOQUEO NEURONAL: Intento de pesca semántica crítica detectado "${query}"`, 'MemoryHub');
          await hub.triggerPanic(`Semantic exfiltration attempt detected: ${query}`, 'MemoryHub');
          return []; // Return empty results on panic
      }
      
      hub.reportIntel('WARNING', `INTENTO DE PESCA SEMÁNTICA DETECTADO: Búsqueda de concepto prohibido "${query}"`, 'MemoryHub');
      // We still return results to avoid breaking the UI, but the attempt is flagged.
    }

    // 3. Recall Immunological Memory (Priority 0.9)
    const threatHits = await this.recallThreats(query);
    results.push(...threatHits);

    // 3. Recall Episodic Memory (Priority 0.6)
    const episodes = await this.chronicler.recall(query);
    const episodicWeight = this.registry?.layers?.episodic?.weight || 0.6;
    
    episodes.forEach(f => results.push({
      source: 'episodic',
      key: f.key,
      content: f.content,
      relevance: episodicWeight,
      metadata: { tags: f.tags, timestamp: f.timestamp }
    }));

    const finalResults = results.sort((a, b) => b.relevance - a.relevance);
    this.semanticCache.set(cacheKey, { results: finalResults, timestamp: now });
    return finalResults;
  }

  private async ensureRegistry() {
    if (!this.registry && await fs.pathExists(this.registryPath)) {
      this.registry = await fs.readJson(this.registryPath);
    }
  }

  private async getCachedContent(filePath: string): Promise<string | null> {
    try {
      const stats = await fs.stat(filePath);
      const mtime = stats.mtimeMs;
      const cached = this.cache.get(filePath);

      if (cached && cached.mtime === mtime) {
        return cached.content;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      this.cache.set(filePath, { content, mtime });
      return content;
    } catch (e) {
      return null;
    }
  }

  private async recallIdentity(query: string): Promise<MemoryResult[]> {
    await this.ensureRegistry();
    const hits: MemoryResult[] = [];
    const identityFiles = this.registry?.layers?.identity?.files || ['rules.md', 'SOGNA_CONTEXT.md'];
    const weight = this.registry?.layers?.identity?.weight || 1.0;

    const isRegex = query.startsWith('/') && query.endsWith('/');
    let regex: RegExp | null = null;
    if (isRegex) {
      try { regex = new RegExp(query.slice(1, -1), 'i'); } catch (e) {}
    }

    for (const fileName of identityFiles) {
      const filePath = path.join(this.rootMemory, fileName);
      const content = await this.getCachedContent(filePath);
      if (!content) continue;

      const match = regex ? regex.test(content) : content.toLowerCase().includes(query.toLowerCase());
      
      if (match) {
        hits.push({
          source: 'identity',
          key: fileName,
          content: `Reference to ${fileName}`,
          relevance: weight
        });
      }
    }
    return hits;
  }

  private async recallThreats(query: string): Promise<MemoryResult[]> {
    await this.ensureRegistry();
    const vaccineDir = path.join(this.securityDir, 'vaccines');
    const hits: MemoryResult[] = [];
    const weight = this.registry?.layers?.immunological?.weight || 0.9;

    const isRegex = query.startsWith('/') && query.endsWith('/');
    let regex: RegExp | null = null;
    if (isRegex) {
      try { regex = new RegExp(query.slice(1, -1), 'i'); } catch (e) {}
    }

    if (await fs.pathExists(vaccineDir)) {
      const logs = await fs.readdir(vaccineDir);
      for (const log of logs) {
        const match = regex ? regex.test(log) : log.toLowerCase().includes(query.toLowerCase());
        if (match) {
          hits.push({
            source: 'immunological',
            key: log,
            content: `Matching threat pattern detected: ${log}`,
            relevance: weight + 0.3 // Dynamic boost for security
          });
        }
      }
    }
    return hits;
  }

  /**
   * Stores a new insight into the appropriate memory layer.
   */
  async storeInsight(key: string, content: string, tags: string[] = []): Promise<void> {
    if (tags.includes('#threat') || tags.includes('#sentinel_veto')) {
       // Log to security layer
       const auditLog = path.join(this.securityDir, 'threat_learning.jsonl');
       const entry = { timestamp: new Date().toISOString(), key, tags, content };
       await fs.appendFile(auditLog, JSON.stringify(entry) + '\n');
    }
    
    // Always store as episodic knowledge for agent recall
    await this.chronicler.init();
    await this.chronicler.memorize({
      key,
      content,
      tags,
      project: 'Sogna',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Performs a structured metadata query across episodic memory.
   */
  /**
   * Generates a neural graph of connections between fragments (agents/knowledge).
   */
  /**
   * Generates a neural graph of connections between fragments (agents/knowledge).
   * Optimized with a 30-second cache to prevent redundant index processing.
   */
  public async getNeuralGraph(): Promise<{ nodes: any[], edges: any[] }> {
    const now = Date.now();
    if (this.graphCache && (now - this.lastGraphUpdate < this.GRAPH_CACHE_TTL)) {
      return this.graphCache;
    }

    let index = await this.chronicler.getIndex();
    if (index.fragments.length === 0) {
      await this.chronicler.init();
      await this.chronicler.rebuildIndex();
      index = await this.chronicler.getIndex();
    }
    const nodes: any[] = [];
    const edges: any[] = [];
    
    index.fragments.forEach((f: any) => {
      nodes.push({ 
        id: f.key, 
        tags: f.tags, 
        type: f.properties?.type || 'fragment',
        swarm: f.properties?.swarm 
      });

      
      // 1. Process explicit raw_links from Frontmatter
      if (f.properties?.raw_links) {
        const links = Array.isArray(f.properties.raw_links) ? f.properties.raw_links : [f.properties.raw_links];
        links.forEach((l: string) => {
          const target = l.replace('[[', '').replace(']]', '').trim();
          edges.push({ source: f.key, target });
        });
      }
      
      // 2. Simple link detection in properties strings (legacy support)
      if (f.properties?.links) {
        const links = Array.isArray(f.properties.links) ? f.properties.links : [f.properties.links];
        links.forEach((l: any) => {
          if (typeof l === 'string' && l.includes('[[')) {
            const match = l.match(/\[\[(.*?)\]\]/);
            if (match) edges.push({ source: f.key, target: match[1] });
          }
        });
      }
      
      // 3. Check colleagues specifically
      if (f.properties?.colleagues) {
        const colleaguesStr = String(f.properties.colleagues);
        const matches = colleaguesStr.matchAll(/\[\[(.*?)\]\]/g);
        for (const match of matches) {
          edges.push({ source: f.key, target: match[1] });
        }
      }

      // 4. Implicit Hub Connections (Cohesion)
      if (f.properties?.swarm) {
        // Bi-directional Swarm connection
        edges.push({ source: f.key, target: f.properties.swarm });
        edges.push({ source: f.properties.swarm, target: f.key });
        
        // Bi-directional Core connection
        edges.push({ source: f.key, target: 'Sogna' });
        edges.push({ source: 'Sogna', target: f.key });
      }
    });

    // 5. Global Bidirectionality Loop (Ensuring every A->B has B->A)
    const existingEdges = new Set(edges.map(e => `${e.source}->${e.target}`));
    const reverseEdges: any[] = [];
    
    edges.forEach(e => {
      const rev = `${e.target}->${e.source}`;
      if (!existingEdges.has(rev)) {
        reverseEdges.push({ source: e.target, target: e.source, type: 'virtual' });
        existingEdges.add(rev);
      }
    });
    
    edges.push(...reverseEdges);

    // Ensure Swarm Anchors exist in nodes list if not already there
    const swarms = ['Skills', 'Agents', 'Core', 'Orchestration', 'Business', 'Engineering', 'Data', 'Product', 'Security', 'Offensive', 'Engines', 'Monitor'];

    swarms.forEach(s => {
      if (!nodes.some(n => n.id === s)) {
        nodes.push({ id: s, tags: ['swarm', 'anchor'], type: 'anchor' });
        edges.push({ source: s, target: 'Sogna' });
        edges.push({ source: 'Sogna', target: s });
      }
    });

    // 6. Fuzzy Linking (Optimized Regex-based implicit mentions)
    const validNodeIds = nodes.filter(n => n.id.length > 5).map(n => n.id);
    if (validNodeIds.length > 0) {
      // Create a combined regex: \b(Concept1|Concept2|...)\b
      const pattern = new RegExp(`\\b(${validNodeIds.map(id => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
      
      index.fragments.forEach((f: any) => {
        const content = f.content;
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const matchedId = match[0];
          // Find original case-sensitive ID from the nodes list if needed, 
          // or just find the first match in validNodeIds that case-insensitively matches
          const targetId = validNodeIds.find(id => id.toLowerCase() === matchedId.toLowerCase());
          
          if (targetId && targetId !== f.key) {
            const edgeId = `${f.key}->${targetId}`;
            if (!existingEdges.has(edgeId)) {
              edges.push({ source: f.key, target: targetId, type: 'fuzzy' });
              edges.push({ source: targetId, target: f.key, type: 'fuzzy-virtual' });
              existingEdges.add(edgeId);
              existingEdges.add(`${targetId}->${f.key}`);
            }
          }
        }
        pattern.lastIndex = 0; // Reset for next fragment
      });
    }

    // 7. Final Integrity Check (Purge Dead Links)
    const validNodeIdsSet = new Set(nodes.map(n => n.id));
    const cleanEdges = edges.filter(e => validNodeIdsSet.has(e.source) && validNodeIdsSet.has(e.target));

    this.graphCache = { nodes, edges: cleanEdges };
    this.lastGraphUpdate = now;
    return this.graphCache;
  }

  /**
   * Evaluates the security criticality of a memory query.
   */
  private evaluateSemanticCriticality(query: string): number {
      const q = query.toLowerCase();
      let score = 0;
      if (q.includes('password') || q.includes('private_key')) score += 0.5;
      if (q.includes('admin') || q.includes('root')) score += 0.3;
      if (q.includes('bypass') || q.includes('exploit')) score += 0.4;
      return Math.min(score, 1.0);
  }

  /**
   * Performs an entropy audit on a string to detect encrypted or compressed secrets.
   */
  public entropyAudit(content: string): { entropy: number, suspicious: boolean } {
      if (!content || content.length < 20) return { entropy: 0, suspicious: false };
      const nonAlphaNumeric = (content.match(/[^a-zA-Z0-9\s]/g) || []).length;
      const entropy = nonAlphaNumeric / content.length;
      return {
          entropy,
          suspicious: entropy > 0.45 && content.length > 100
      };
  }

  /**
   * Performs a health check on the neural network.
   */
  public async checkHealth(): Promise<HealthReport> {
    return this.immuneSystem.scanHealth();
  }

  /**
   * Triggers an evolution step for an agent.
   */
  public async evolve(agentId: string, success: boolean): Promise<void> {
    return this.neuralLearning.evolveAgent(agentId, { success });
  }

  public async query(filters: Record<string, any>): Promise<MemoryResult[]> {
    const episodes = await this.chronicler.query(filters);
    const weight = this.registry?.layers?.episodic?.weight || 0.6;
    
    return episodes.map(f => ({
      source: 'episodic',
      key: f.key,
      content: f.content,
      relevance: weight,
      metadata: { ...f.properties, tags: f.tags, timestamp: f.timestamp }
    }));
  }

  /**
   * Performs a conceptual semantic search using the neural graph.
   * This is the foundation for "Infinite Memory".
   */
  public async semanticRecall(concept: string): Promise<MemoryResult[]> {
    const graph = await this.getNeuralGraph();
    const index = await this.chronicler.getIndex();
    
    // 1. Find the "Anchor" nodes (nodes matching or related to the concept)
    const anchors = graph.nodes.filter(n => {
      const id = n.id.toLowerCase();
      const search = concept.toLowerCase();
      
      // Fuzzy matching: includes, startsWith, or common abbreviations
      const isMatch = id.includes(search) || 
                      search.includes(id) || 
                      (search === 'infrastructure' && id.includes('infra')) ||
                      (search === 'security' && id.includes('sec')) ||
                      n.tags.some((t: string) => t.toLowerCase().includes(search));
      
      return isMatch;
    });

    // 2. Expand the search to neighbors (1st and 2nd degree)
    const neighborIds = new Set<string>(anchors.map(a => a.id));
    graph.edges.forEach(e => {
      if (neighborIds.has(e.source)) neighborIds.add(e.target);
      if (neighborIds.has(e.target)) neighborIds.add(e.source);
    });

    // 3. Retrieve fragments for all identified nodes
    const results: MemoryResult[] = [];
    for (const f of index.fragments.filter(f => neighborIds.has(f.key))) {
      let content = '';
      try {
        if (await fs.pathExists(f.fileName)) {
          const raw = await fs.readFile(f.fileName, 'utf-8');
          content = raw.replace(/^---\r?\n[\s\S]+?\r?\n---/, '').trim();
        }
      } catch (e) {}

      results.push({
        source: 'operational',
        key: f.key,
        content: content || `Reference to ${f.key}`,
        relevance: neighborIds.has(f.key) ? 0.9 : 0.5,
        metadata: { ...f.properties, tags: f.tags, conceptual_match: true }
      });
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }
}
