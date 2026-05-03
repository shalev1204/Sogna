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
    return await this.readIndex();
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
    
    const allFiles = new Set<string>();
    for (const sourceDir of this.sources) {
      if (!(await fs.pathExists(sourceDir))) continue;
      const files = await this.getFilesRecursively(sourceDir);
      files.forEach(f => allFiles.add(f));
    }

    for (const filePath of allFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const fragment = this.parseFragment(content, filePath);
      const blocks = this.extractBlocks(fragment.content);

      index.fragments.push({
        key: fragment.key,
        tags: fragment.tags,
        fileName: filePath,
        timestamp: fragment.timestamp,
        blocks,
        properties: fragment.properties
      });
    }

    await this.writeIndex(index);
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
    const index: MemoryIndex = await this.readIndex();
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
    await this.writeIndex(index);
  }

  /**
   * Recalls knowledge using Smart Search (Regex support + Block awareness).
   */
  async recall(query: string): Promise<KnowledgeFragment[]> {
    if (!(await fs.pathExists(this.indexFile))) return [];

    const index: MemoryIndex = await this.readIndex();
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
    
    const index: MemoryIndex = await this.readIndex();
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

  private parseFragment(markdown: string, filePath?: string): KnowledgeFragment {
    // Extract frontmatter safely (only at the very beginning, max 2000 chars)
    const fmRegex = /^---\r?\n([\s\S]+?)\r?\n---/;

    const frontmatterMatch = markdown.slice(0, 2000).match(fmRegex);
    const metadata: any = {};
    const properties: Record<string, any> = {};
    
    if (frontmatterMatch) {
      const fmContent = frontmatterMatch[1];
      // Safety: If FM looks like real content (too long or no colons), skip it
      if (fmContent.length > 1500) {
        console.warn(`[Chronicler] Metadata explosion protected in ${filePath || 'unknown'}`);
      } else {
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
      }
    }


    // Implicit Swarm/Project Inference from Path
    if (filePath) {
      if (!properties.swarm) {
        if (filePath.includes('skills')) properties.swarm = 'Skills';
        else if (filePath.includes('agents')) properties.swarm = 'Agents';
        else if (filePath.includes('Sentinel')) properties.swarm = 'Security';
        else if (filePath.includes('Predatore')) properties.swarm = 'Offensive';
        else if (filePath.includes('engines')) properties.swarm = 'Engines';
        else if (filePath.includes('observability')) properties.swarm = 'Monitor';
        else if (filePath.includes('intelligence')) properties.swarm = 'Core';
        else properties.swarm = 'Core'; 
      }


      if (!properties.project) properties.project = 'Sogna';
    }

    // Special extraction: Look for ANY [[link]] in the ENTIRE document (FM + Body)
    const allLinks = markdown.match(/\[\[(.*?)\]\]/g);
    if (allLinks) {
      properties.raw_links = Array.from(new Set(allLinks));
    }

    let bodyContent = markdown;
    if (frontmatterMatch && frontmatterMatch[1].length <= 1500) {
      bodyContent = markdown.replace(/^---\r?\n[\s\S]+?\r?\n---/, '').trim();
    }

    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    
    // Fallback order: FM Key -> FM ID -> H1 Title -> Filename
    let fragmentKey = metadata.key || metadata.id;
    if (!fragmentKey) {
      if (titleMatch) {
        fragmentKey = titleMatch[1].trim();
      } else if (filePath) {
        fragmentKey = path.basename(filePath, '.md');
      } else {
        fragmentKey = 'unknown';
      }
    }
    
    return {
      key: fragmentKey,
      project: metadata.project || 'global',
      tags: (metadata.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
      timestamp: metadata.timestamp || new Date().toISOString(),
      content: bodyContent.split(/\r?\n/).filter(l => !l.startsWith('#')).join('\n').trim(),
      properties
    };

  }

  private async readIndex(): Promise<MemoryIndex> {
    if (!(await fs.pathExists(this.indexFile))) return { fragments: [], lastUpdated: '' };
    
    try {
      const dataStr = await fs.readFile(this.indexFile, 'utf8');
      
      // Auto-Detect Encryption: Encrypted strings don't start with JSON braces
      if (dataStr.length > 50 && !dataStr.trim().startsWith('{')) {
        const { Guardian } = await import('../guardian.js');
        const decrypted = Guardian.getInstance().unsealData<MemoryIndex>(dataStr);
        if (decrypted) return decrypted;
        console.error('[CHRONICLER] Decryption failed. Returning empty index.');
        return { fragments: [], lastUpdated: '' };
      }
      
      return JSON.parse(dataStr);
    } catch (e) {
      console.error(`[CHRONICLER] Error reading index: ${e}`);
      return { fragments: [], lastUpdated: '' };
    }
  }

  private async writeIndex(index: MemoryIndex): Promise<void> {
    // 1. Data Pruning (Entropy Control)
    if (index.fragments.length > 1000) {
      const { PruningService } = await import('./pruningservice.js');
      await PruningService.getInstance().prune(this.indexFile, {
        minWeight: 0.2,
        maxAgeDays: 60,
        preserveTags: ['institutional', 'sovereign', 'sentinel']
      });
      // Re-read after pruning to ensure we encrypt the clean version
      const data = await fs.readFile(this.indexFile, 'utf8');
      try {
        index = JSON.parse(data);
      } catch (e) {
        // Fallback to memory index if file was corrupted during prune (unlikely)
      }
    }

    let output: string;
    
    if (process.env.SOGNA_ENCRYPT_MEMORY === 'true') {
      const { Guardian } = await import('../guardian.js');
      output = Guardian.getInstance().sealData(index);
      console.log('[CHRONICLER] Neural Index sealed with Guardian AES-256.');
    } else {
      output = JSON.stringify(index, null, 2);
    }
    
    await fs.writeFile(this.indexFile, output, 'utf8');
  }

  private async getFilesRecursively(dir: string): Promise<string[]> {
    const skipDirs = ['node_modules', '.git', '.turbo', 'dist', 'assets', 'out', 'build', '.sognatore'];
    let results: string[] = [];
    try {
      const list = await fs.readdir(dir);
      for (const file of list) {
        if (skipDirs.includes(file)) continue;
        const filePath = path.resolve(dir, file);
        const stat = await fs.stat(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(await this.getFilesRecursively(filePath));
        } else if (file.endsWith('.md')) {
          results.push(filePath);
        }
      }
    } catch (e) {
      // Skip directories that can't be read
    }
    return results;
  }
}

