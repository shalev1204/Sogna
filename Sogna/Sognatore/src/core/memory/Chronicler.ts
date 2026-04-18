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

/**
 * Sognatore Chronicler - The Long-Term Memory Engine
 * Manages persistent knowledge fragments in Markdown format.
 */
export class Chronicler {
  private memoryDir: string;
  private intelligenceDir: string;

  constructor(baseDir: string = '.') {
    this.memoryDir = path.resolve(baseDir, 'memory');
    this.intelligenceDir = path.join(this.memoryDir, 'intelligence');
  }

  /**
   * Initializes the memory directories.
   */
  async init(): Promise<void> {
    await fs.ensureDir(this.intelligenceDir);
  }

  /**
   * Memorizes a new fragment of knowledge.
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
    return filePath;
  }

  /**
   * Recalls knowledge related to a query.
   * Simple implementation: matches keys or tags.
   */
  async recall(query: string): Promise<KnowledgeFragment[]> {
    if (!(await fs.pathExists(this.intelligenceDir))) return [];

    const files = await fs.readdir(this.intelligenceDir);
    const results: KnowledgeFragment[] = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const content = await fs.readFile(path.join(this.intelligenceDir, file), 'utf-8');
      const fragment = this.parseFragment(content);
      
      if (this.isMatch(fragment, query)) {
        results.push(fragment);
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
      content: content.split('\n').slice(2).join('\n').trim() // Skip H1 title
    };
  }

  private isMatch(fragment: KnowledgeFragment, query: string): boolean {
    const q = query.toLowerCase();
    return (
      fragment.key.toLowerCase().includes(q) ||
      fragment.tags.some(t => t.toLowerCase().includes(q)) ||
      fragment.content.toLowerCase().includes(q)
    );
  }
}
