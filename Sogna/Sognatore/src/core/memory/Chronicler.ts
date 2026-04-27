import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

export interface KnowledgeFragment {
  key: string;
  project: string;
  tags: string[];
  content: string;
  timestamp: string;
  properties?: Record<string, any>; // Dynamic YAML properties
}

interface MemoryIndex {
  fragments: Array<{
    key: string;
    tags: string[];
    fileName: string;
    timestamp: string;
    blocks: string[];
    properties?: Record<string, any>; // Added for indexing
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
  private sources: string[] = [];

  public static getInstance(baseDir: string = '.'): Chronicler {
    if (!Chronicler.instance) {
      Chronicler.instance = new Chronicler(baseDir);
    }
    return Chronicler.instance;
  }

  public constructor(baseDir: string = '.') {
    this.memoryDir = path.resolve(baseDir, 'memory');
    this.intelligenceDir = path.join(this.memoryDir, 'intelligence');
    this.indexFile = path.join(this.intelligenceDir, 'index.json');
    this.sources = [this.intelligenceDir];
  }

  /**
   * Adds a new directory as a source of knowledge fragments.
   */
  public addSource(dir: string): void {
    const absolutePath = path.resolve(dir);
    if (!this.sources.includes(absolutePath)) {
      this.sources.push(absolutePath);
    }
  }

  /**
   * Returns the current memory index.
   */
  public async getIndex(): Promise<MemoryIndex> {
    if (!(await fs.pathExists(this.indexFile))) return { fragments: [], lastUpdated: '' };
    return await fs.readJson(this.indexFile);
  }

  /**
   * Returns the index file path.
   */
  public getIndexFile(): string {
    return this.indexFile;
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
    const index: MemoryIndex = { fragments: [], lastUpdated: new Date().toISOString() };
    
    for (const sourceDir of this.sources) {
      if (!(await fs.pathExists(sourceDir))) continue;
      
      const files = (await fs.readdir(sourceDir)).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(sourceDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const fragment = this.parseFragment(content);
        const blocks = this.extractBlocks(fragment.content);

        index.fragments.push({
          key: fragment.key,
          tags: fragment.tags,
          fileName: filePath, // Using absolute path now for multi-source
          timestamp: fragment.timestamp,
          blocks,
          properties: fragment.properties
        });
      }
    }

    await fs.writeJson(this.indexFile, index, { spaces: 2 });
  }

  private extractBlocks(content: string): string[] {
    const blockRegex = /\s\^([a-zA-Z0-9-]+)$/gm;
    const blocks: string[] = [];
    let match;
    while ((match = blockRegex.exec(content)) !== null) {
      blocks.push(match[1]);
    }
    return blocks;
  }

  /**
   * Memorizes a new fragment of knowledge and updates the index.
   */
  async memorize(fragment: KnowledgeFragment): Promise<void> {
    await this.init(); // Ensure directories and index exist
    
    const timestamp = new Date().toISOString();
    const fileName = `${fragment.key.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.md`;
    const filePath = path.join(this.intelligenceDir, fileName);
    const blocks = this.extractBlocks(fragment.content);

    // Merge properties into YAML
    const props = fragment.properties || {};
    const yamlLines = [
      `key: ${fragment.key}`,
      `project: ${fragment.project}`,
      `tags: ${fragment.tags.join(', ')}`,
      `timestamp: ${timestamp}`
    ];
    
    Object.entries(props).forEach(([k, v]) => {
      if (!['key', 'project', 'tags', 'timestamp'].includes(k)) {
        yamlLines.push(`${k}: ${v}`);
      }
    });

    const markdown = `---\n${yamlLines.join('\n')}\n---\n\n# ${fragment.key}\n\n${fragment.content}\n`;

    await fs.writeFile(filePath, markdown, 'utf-8');
    
    // Incrementally update index
    const index: MemoryIndex = await fs.readJson(this.indexFile);
    const newFragment = {
      key: fragment.key,
      tags: fragment.tags,
      fileName,
      timestamp,
      blocks,
      properties: props // Persist properties in index
    };
    index.fragments.push(newFragment);
    index.lastUpdated = timestamp;
    await fs.writeJson(this.indexFile, index, { spaces: 2 });
  }

  /**
   * Recalls knowledge using Smart Search (Regex support + Block awareness).
   */
  async recall(query: string): Promise<KnowledgeFragment[]> {
    if (!(await fs.pathExists(this.indexFile))) return [];

    const index: MemoryIndex = await fs.readJson(this.indexFile);
    const isRegex = query.startsWith('/') && query.endsWith('/');
    const isBlock = query.startsWith('^');
    let regex: RegExp | null = null;
    
    if (isRegex) {
      try {
        regex = new RegExp(query.slice(1, -1), 'i');
      } catch (e) {
        // Fallback to literal
      }
    }

    const q = query.toLowerCase();
    
    // 1. Filter by index (High Speed)
    const indexMatches = index.fragments.filter(f => {
      if (isBlock) return f.blocks.includes(query.slice(1));
      if (regex) {
        return regex.test(f.key) || f.tags.some(t => regex!.test(t));
      }
      return f.key.toLowerCase().includes(q) || 
             f.tags.some(t => t.toLowerCase().includes(q));
    });

    const results: KnowledgeFragment[] = [];
    const seenFiles = new Set<string>();

    for (const match of indexMatches) {
      const content = await fs.readFile(match.fileName, 'utf-8');
      const fragment = this.parseFragment(content);
      
      // If it's a block search, prune content to just that block
      if (isBlock) {
        const blockId = query.slice(1);
        const lines = fragment.content.split('\n');
        const blockContent = lines.find(l => l.includes(`^${blockId}`));
        if (blockContent) {
          fragment.content = blockContent.replace(`^${blockId}`, '').trim();
        }
      }
      
      results.push(fragment);
      seenFiles.add(match.fileName);
    }

    // 2. Fallback: Full Body Search (If results are low and not a block search)
    if (results.length < 3 && !isBlock) {
      for (const sourceDir of this.sources) {
        if (!(await fs.pathExists(sourceDir))) continue;
        const allFiles = await fs.readdir(sourceDir);
        for (const file of allFiles) {
          const filePath = path.join(sourceDir, file);
          if (!file.endsWith('.md') || seenFiles.has(filePath) || file === 'index.json') continue;
          
          const content = await fs.readFile(filePath, 'utf-8');
          const matchFound = regex ? regex.test(content) : content.toLowerCase().includes(q);
          
          if (matchFound) {
            results.push(this.parseFragment(content));
            if (results.length >= 10) break;
          }
        }
        if (results.length >= 10) break;
      }
    }

    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Performs a structured query over metadata properties.
   * Example: chronicler.query({ status: 'active', project: 'Sogna' })
   */
  async query(filters: Record<string, any>): Promise<KnowledgeFragment[]> {
    if (!(await fs.pathExists(this.indexFile))) return [];
    
    const index: MemoryIndex = await fs.readJson(this.indexFile);
    const matches = index.fragments.filter(f => {
      const props = f.properties || {};
      return Object.entries(filters).every(([key, val]) => {
        console.log(`Checking filter ${key}:${val} against fragment ${f.key} props:`, JSON.stringify(props));
        // Support direct match or tag search if key is 'tags'
        if (key === 'tags' && Array.isArray(val)) {
          return val.every(t => f.tags.includes(t));
        }
        const match = props[key] === val || f[key as keyof typeof f] === val;
        return match;
      });
    });

    const results: KnowledgeFragment[] = [];
    for (const match of matches) {
      const content = await fs.readFile(match.fileName, 'utf-8');
      results.push(this.parseFragment(content));
    }

    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private parseFragment(markdown: string): KnowledgeFragment {
    const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    const metadata: any = {};
    const properties: Record<string, any> = {};
    
    if (frontmatterMatch) {
      const fmContent = frontmatterMatch[1];
      const lines = fmContent.split(/\r?\n/);
      
      lines.forEach(line => {
        // Handle standard key: value or list item - key: value
        const cleanLine = line.replace(/^-\s*/, '').trim();
        const separatorIndex = cleanLine.indexOf(':');
        
        if (separatorIndex > 0) {
          const key = cleanLine.slice(0, separatorIndex).trim();
          const value = cleanLine.slice(separatorIndex + 1).trim();
          metadata[key] = value;
          properties[key] = value;
        }
      });
      
      // Special extraction: Always look for ANY [[link]] in the entire Frontmatter
      const fmLinks = fmContent.match(/\[\[(.*?)\]\]/g);
      if (fmLinks) {
        properties.raw_links = fmLinks; // Keep for the graph engine
      }
    }

    const content = markdown.replace(/^---\r?\n[\s\S]+?\r?\n---/, '').trim();
    const fragmentKey = metadata.key || metadata.id || 'unknown';
    
    return {
      key: fragmentKey,
      project: metadata.project || 'global',
      tags: (metadata.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
      timestamp: metadata.timestamp || new Date().toISOString(),
      content: content.split(/\r?\n/).filter(l => !l.startsWith('#')).join('\n').trim(),
      properties
    };
  }
}
