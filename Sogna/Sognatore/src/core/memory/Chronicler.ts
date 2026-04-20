import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

export interface KnowledgeFragment {
  key: string;
  content: string;
  tags: string[];
  timestamp: string;
  project: string;
}

interface MemoryIndex {
  fragments: Array<{
    key: string;
    tags: string[];
    fileName: string;
    timestamp: string;
  }>;
  lastUpdated: string;
}

/**
 * Sognatore Chronicler - The Long-Term Memory Engine
 * Manages persistent knowledge fragments with High-Speed Indexing.
 */
export class Chronicler {
  private static instance: Chronicler;
  private memoryDir: string;
  private intelligenceDir: string;
  private indexFile: string;

  public static getInstance(baseDir: string = '.'): Chronicler {
    if (!Chronicler.instance) {
      Chronicler.instance = new Chronicler(baseDir);
    }
    return Chronicler.instance;
  }

  private constructor(baseDir: string = '.') {
    this.memoryDir = path.resolve(baseDir, 'memory');
    this.intelligenceDir = path.join(this.memoryDir, 'intelligence');
    this.indexFile = path.join(this.intelligenceDir, 'index.json');
  }

  /**
   * Initializes the memory directories and indexing.
   */
  async init(): Promise<void> {
    await fs.ensureDir(this.intelligenceDir);
    if (!(await fs.pathExists(this.indexFile))) {
      await this.rebuildIndex();
    }
  }

  /**
   * Rebuilds the entire memory index from disk.
   */
  async rebuildIndex(): Promise<void> {
    const files = await fs.readdir(this.intelligenceDir);
    const index: MemoryIndex = { fragments: [], lastUpdated: new Date().toISOString() };

    for (const file of files) {
      if (!file.endsWith('.md') || file === 'index.json') continue;
      
      const content = await fs.readFile(path.join(this.intelligenceDir, file), 'utf-8');
      const fragment = this.parseFragment(content);
      index.fragments.push({
        key: fragment.key,
        tags: fragment.tags,
        fileName: file,
        timestamp: fragment.timestamp
      });
    }

    await fs.writeJson(this.indexFile, index, { spaces: 2 });
  }

  /**
   * Memorizes a new fragment of knowledge and updates the index.
   */
  async memorize(fragment: Omit<KnowledgeFragment, 'timestamp'>): Promise<string> {
    const timestamp = new Date().toISOString();
    const fileName = `${fragment.key.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.md`;
    const filePath = path.join(this.intelligenceDir, fileName);

    const markdown = `---
key: ${fragment.key}
project: ${fragment.project}
tags: ${fragment.tags.join(', ')}
timestamp: ${timestamp}
---

# ${fragment.key}

${fragment.content}
`;

    await fs.writeFile(filePath, markdown, 'utf-8');
    
    // Incrementally update index
    const index: MemoryIndex = await fs.readJson(this.indexFile);
    index.fragments.push({
      key: fragment.key,
      tags: fragment.tags,
      fileName,
      timestamp
    });
    index.lastUpdated = timestamp;
    await fs.writeJson(this.indexFile, index, { spaces: 2 });

    return filePath;
  }

  /**
   * Recalls knowledge related to a query using the index with full-body fallback.
   */
  async recall(query: string): Promise<KnowledgeFragment[]> {
    if (!(await fs.pathExists(this.indexFile))) return [];

    const index: MemoryIndex = await fs.readJson(this.indexFile);
    const q = query.toLowerCase();
    
    // 1. Filter by index (High Speed)
    const indexMatches = index.fragments.filter(f => 
      f.key.toLowerCase().includes(q) || 
      f.tags.some(t => t.toLowerCase().includes(q))
    );

    const results: KnowledgeFragment[] = [];
    const seenFiles = new Set<string>();

    for (const match of indexMatches) {
      const content = await fs.readFile(path.join(this.intelligenceDir, match.fileName), 'utf-8');
      results.push(this.parseFragment(content));
      seenFiles.add(match.fileName);
    }

    // 2. Fallback: Full Body Search (If results are low)
    if (results.length < 3) {
      const allFiles = await fs.readdir(this.intelligenceDir);
      for (const file of allFiles) {
        if (!file.endsWith('.md') || seenFiles.has(file) || file === 'index.json') continue;
        
        const content = await fs.readFile(path.join(this.intelligenceDir, file), 'utf-8');
        if (content.toLowerCase().includes(q)) {
          results.push(this.parseFragment(content));
          if (results.length >= 10) break; // Cap fallback results
        }
      }
    }

    // Sort by most recent
    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private parseFragment(markdown: string): KnowledgeFragment {
    const frontmatterMatch = markdown.match(/^---\n([\s\S]+?)\n---/);
    const metadata: any = {};
    
    if (frontmatterMatch) {
      const lines = frontmatterMatch[1].split('\n');
      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          metadata[key.trim()] = valueParts.join(':').trim();
        }
      });
    }

    const content = markdown.replace(/^---\n[\s\S]+?\n---/, '').trim();
    
    return {
      key: metadata.key || 'unknown',
      project: metadata.project || 'global',
      tags: (metadata.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
      timestamp: metadata.timestamp || new Date().toISOString(),
      content: content.split('\n').filter(l => !l.startsWith('#')).join('\n').trim()
    };
  }
}
