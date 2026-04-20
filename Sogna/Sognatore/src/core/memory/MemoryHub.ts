import fs from 'fs-extra';
import path from 'path';
import { Chronicler, KnowledgeFragment } from './Chronicler.js';

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
  private registryPath: string;
  private registry: any = null;
  private cache: Map<string, { content: string, mtime: number }> = new Map();

  private constructor() {
    this.rootMemory = path.resolve(process.cwd(), 'memory');
    this.securityDir = path.join(this.rootMemory, 'security');
    this.registryPath = path.join(this.rootMemory, 'registry.json');
    this.chronicler = Chronicler.getInstance();
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
    await this.ensureRegistry();
    const results: MemoryResult[] = [];

    // 1. Recall Identity Memory (Priority 1.0)
    const identityHits = await this.recallIdentity(query);
    results.push(...identityHits);

    // 2. Recall Immunological Memory (Priority 0.9)
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

    return results.sort((a, b) => b.relevance - a.relevance);
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

    for (const fileName of identityFiles) {
      const filePath = path.join(this.rootMemory, fileName);
      const content = await this.getCachedContent(filePath);
      
      if (content && content.toLowerCase().includes(query.toLowerCase())) {
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

    if (await fs.pathExists(vaccineDir)) {
      const logs = await fs.readdir(vaccineDir);
      for (const log of logs) {
        if (log.toLowerCase().includes(query.toLowerCase())) {
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
      project: 'Sogna'
    });
  }
}
