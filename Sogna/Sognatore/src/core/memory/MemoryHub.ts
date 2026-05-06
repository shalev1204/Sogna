import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Chronicler, KnowledgeFragment } from './Chronicler.js';
import { ImmuneSystem, HealthReport } from './ImmuneSystem.js';
import { NeuralLearning } from './NeuralLearning.js';

export interface MemoryResult {
  source: 'identity' | 'episodic' | 'immunological' | 'audit' | 'operational' | 'archival' | 'synapse';
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
  private _immuneSystem: ImmuneSystem | null = null;
  private _neuralLearning: NeuralLearning | null = null;
  private projectRoot: string;
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

    this.projectRoot = findRoot(process.cwd());
    this.rootMemory = rootMemory ? path.resolve(rootMemory) : path.resolve(this.projectRoot, 'memory');
    this.securityDir = path.join(this.rootMemory, 'security');
    this.agencyDir = path.resolve(this.projectRoot, 'toolkit/agents'); 
    
    this.registryPath = path.join(this.rootMemory, 'registry.json');
    this.chronicler = chronicler || Chronicler.getInstance(this.projectRoot);
    
    // Add default sources
    this.chronicler.addSource(this.agencyDir); 
    this.chronicler.addSource(path.resolve(this.projectRoot, 'toolkit/skills')); 
    this.chronicler.addSource(this.projectRoot); 

    // Engines will be loaded from registry in initialize()
  }

  /**
   * Initializes dynamic components and registry-based sources.
   */
  public async initialize(): Promise<void> {
    await this.ensureRegistry();
    if (this.registry?.engines) {
      const enginesRoot = path.resolve(this.projectRoot, this.registry.engines.root);
      const definitions = this.registry.engines.definitions;
      for (const [name, def] of Object.entries(definitions)) {
        const enginePath = path.join(enginesRoot, (def as any).path);
        if (await fs.pathExists(enginePath)) {
          this.chronicler.addSource(enginePath);
        }
      }
    }
  }

  private get immuneSystem(): ImmuneSystem {
    if (!this._immuneSystem) {
      this._immuneSystem = new ImmuneSystem(this);
    }
    return this._immuneSystem;
  }

  private get neuralLearning(): NeuralLearning {
    if (!this._neuralLearning) {
      this._neuralLearning = new NeuralLearning(this.chronicler);
    }
    return this._neuralLearning;
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

    // 1. PROACTIVE NEURAL DECOYS: Check for "Trap Concepts"
    const trapConcepts = ['password', 'secret', 'bypass', 'root', 'admin', 'auth_token', 'private_key'];
    const lowerQuery = query.toLowerCase();
    if (trapConcepts.some(trap => lowerQuery.includes(trap))) {
      const hub = (await import('../../Sentinel-Sognatore/Hub.js')).Hub.getInstance();
      
      // Security Hardening: Trigger Auto-Panic if the attempt is highly critical
      const criticality = this.evaluateSemanticCriticality(query);
      if (criticality > 0.8) {
          hub.reportIntel('CRITICAL', `BLOQUEO NEURONAL: Intento de pesca semántica crítica detectado "${query}"`, 'MemoryHub');
          await hub.triggerPanic(`Semantic exfiltration attempt detected: ${query}`, 'MemoryHub');
          return []; // Return empty results on panic
      }
      
      hub.reportIntel('WARNING', `INTENTO DE PESCA SEMÁNTICA DETECTADO: Búsqueda de concepto prohibido "${query}"`, 'MemoryHub');
    }

    // 2. Parallelized Memory Recall
    const [identityHits, threatHits, episodes] = await Promise.all([
      this.recallIdentity(query),
      this.recallThreats(query),
      this.chronicler.recall(query)
    ]);

    results.push(...identityHits);
    results.push(...threatHits);

    const episodicWeight = this.registry?.layers?.episodic?.weight || 0.6;
    episodes.forEach(f => results.push({
      source: 'episodic',
      key: f.key,
      content: f.content,
      relevance: episodicWeight,
      metadata: { tags: f.tags, timestamp: f.timestamp }
    }));

    // 3. UNLIMITED MEMORY FALLBACK: Check archival tier if no strong hits
    let finalResults = results.sort((a, b) => b.relevance - a.relevance);
    
    if (finalResults.length === 0 || finalResults[0].relevance < 0.5) {
      const archiveHits = await this.recallArchive(query);
      if (archiveHits.length > 0) {
        results.push(...archiveHits);
        finalResults = results.sort((a, b) => b.relevance - a.relevance);
      }
    }

    this.semanticCache.set(cacheKey, { results: finalResults, timestamp: now });
    return finalResults;
  }

  /**
   * Recalls information from the archival tier (Cold Storage).
   * Part of the "Unlimited Memory" architecture.
   */
  private async recallArchive(query: string): Promise<MemoryResult[]> {
    const archiveDir = path.join(this.rootMemory, 'archive');
    if (!(await fs.pathExists(archiveDir))) return [];

    const hits: MemoryResult[] = [];
    const weight = this.registry?.layers?.archival?.weight || 0.2;
    
    // Recursive search in archive subdirectories
    const searchArchive = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await searchArchive(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().includes(query.toLowerCase())) {
          hits.push({
            source: 'archival',
            key: entry.name,
            content: `Historical record found in archive: ${entry.name}`,
            relevance: weight
          });
        }
      }
    };

    await searchArchive(archiveDir);
    return hits;
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

    await Promise.all(identityFiles.map(async (fileName: string) => {
      const filePath = path.join(this.rootMemory, fileName);
      const content = await this.getCachedContent(filePath);
      if (!content) return;

      const match = regex ? regex.test(content) : content.toLowerCase().includes(query.toLowerCase());
      
      if (match) {
        hits.push({
          source: 'identity',
          key: fileName,
          content: `Reference to ${fileName}`,
          relevance: weight
        });
      }
    }));
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
      await Promise.all(logs.map(async (log: string) => {
        const match = regex ? regex.test(log) : log.toLowerCase().includes(query.toLowerCase());
        if (match) {
          hits.push({
            source: 'immunological',
            key: log,
            content: `Matching threat pattern detected: ${log}`,
            relevance: weight + 0.3 // Dynamic boost for security
          });
        }
      }));
    }
    return hits;
  }

  /**
   * Fires a synapse (behavioral event) from an engine into the memory layers.
   * Ensures the system is "connected to everything".
   */
  async fireSynapse(engine: string, type: string, data: any): Promise<void> {
    const synapseDir = path.join(this.rootMemory, 'synapses', engine.toLowerCase());
    await fs.ensureDir(synapseDir);
    
    const synapseFile = path.join(synapseDir, `${type.toLowerCase()}.jsonl`);
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      data,
      context: 'Sogna'
    };
    
    await fs.appendFile(synapseFile, JSON.stringify(entry) + '\n');
    console.log(chalk.blue(`🧠 [SYNAPSE] Learned behavior captured from ${engine}: ${type}`));
  }

  /**
   * Recalls behavioral synapses for a specific engine.
   */
  async recallSynapses(engine: string, type?: string): Promise<any[]> {
    const synapseDir = path.join(this.rootMemory, 'synapses', engine.toLowerCase());
    if (!(await fs.pathExists(synapseDir))) return [];

    let files = await fs.readdir(synapseDir);
    if (type) {
      files = files.filter(f => f.startsWith(type.toLowerCase()));
    }

    const allEntries: any[] = [];
    for (const file of files) {
      const content = await fs.readFile(path.join(synapseDir, file), 'utf-8');
      allEntries.push(...content.trim().split('\n').map(line => JSON.parse(line)));
    }

    return allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Stores a new insight into the appropriate memory layer.
   */
  async storeInsight(key: string, content: string, tags: string[] = []): Promise<void> {
    if (tags.includes('#threat') || tags.includes('#sentinel_veto')) {
       const auditLog = path.join(this.securityDir, 'threat_learning.jsonl');
       const entry = { timestamp: new Date().toISOString(), key, tags, content };
       await fs.appendFile(auditLog, JSON.stringify(entry) + '\n');
    }
    
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

  /**
   * Performs deep ecosystem maintenance.
   * Cleans caches, prunes neural entropy, and validates registry.
   */
  public async maintenance(): Promise<void> {
    console.log(chalk.bold.magenta('🧹 [MEMORY_HUB] Iniciando mantenimiento profundo (Modo Unlimited)...'));
    
    const { PruningService } = await import('./PruningService.js');
    const pruning = PruningService.getInstance();
    
    await this.ensureRegistry();
    const archiveAfter = this.registry?.synthesis?.archive_after_days || 30;

    // 1. Archive Navigator Cache (Non-destructive)
    const navCache = path.join(this.rootMemory, 'Navigator/cache');
    await pruning.pruneDirectory(navCache, 7);
    
    // 2. Archive Operational Session Data
    const agentDir = path.join(this.rootMemory, 'agent');
    await pruning.pruneDirectory(agentDir, archiveAfter);

    // 3. Archive Synapse Logs
    const synapsesDir = path.join(this.rootMemory, 'synapses');
    await pruning.pruneDirectory(synapsesDir, archiveAfter);
    
    // 4. Entropy Control for Neural Index
    await pruning.prune(this.chronicler.getIndexFile(), {
      minWeight: 0.1,
      maxAgeDays: archiveAfter * 2, // Keep index entries longer than physical files
      preserveTags: ['institutional', 'sovereign', 'core']
    });

    console.log(chalk.bold.green('✨ [MEMORY_HUB] Mantenimiento completado. Memoria archivada y optimizada.'));
  }
}
