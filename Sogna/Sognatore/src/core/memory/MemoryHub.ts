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

  private constructor() {
    this.rootMemory = path.resolve(process.cwd(), 'memory');
    this.securityDir = path.join(this.rootMemory, 'security');
    this.chronicler = Chronicler.getInstance();
  }

  public static getInstance(): MemoryHub {
    if (!MemoryHub.instance) {
      MemoryHub.instance = new MemoryHub();
    }
    return MemoryHub.instance;
  }

  /**
   * Performs a cross-layer memory search.
   */
  async unifiedRecall(query: string): Promise<MemoryResult[]> {
    const results: MemoryResult[] = [];

    // 1. Recall Episodic Memory (Chronicler)
    const episodes = await this.chronicler.recall(query);
    episodes.forEach(f => results.push({
      source: 'episodic',
      key: f.key,
      content: f.content,
      relevance: 1.0,
      metadata: { tags: f.tags, timestamp: f.timestamp }
    }));

    // 2. Recall Identity Memory (Rules/Context)
    const identityHits = await this.recallIdentity(query);
    results.push(...identityHits);

    // 3. Recall Immunological Memory (Threat Patterns)
    const threatHits = await this.recallThreats(query);
    results.push(...threatHits);

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  private async recallIdentity(query: string): Promise<MemoryResult[]> {
    const rulesPath = path.join(this.rootMemory, 'rules.md');
    const contextPath = path.join(this.rootMemory, 'SOGNA_CONTEXT.md');
    const hits: MemoryResult[] = [];

    const searchFiles = [rulesPath, contextPath];
    for (const file of searchFiles) {
      if (await fs.pathExists(file)) {
        const content = await fs.readFile(file, 'utf-8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          hits.push({
            source: 'identity',
            key: path.basename(file),
            content: 'Reference to Institutional Rules/Context',
            relevance: 0.8
          });
        }
      }
    }
    return hits;
  }

  private async recallThreats(query: string): Promise<MemoryResult[]> {
    const vaccineDir = path.join(this.securityDir, 'vaccines');
    const hits: MemoryResult[] = [];

    if (await fs.pathExists(vaccineDir)) {
      const logs = await fs.readdir(vaccineDir);
      for (const log of logs) {
        if (log.includes(query.toLowerCase())) {
          hits.push({
            source: 'immunological',
            key: log,
            content: 'Matching threat pattern detected in Immunological memory.',
            relevance: 1.2 // High relevance for security matches
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
