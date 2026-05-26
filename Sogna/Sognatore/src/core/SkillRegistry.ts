import { Color } from '@Sogna/Curator';
import path from 'path';
import fs from 'fs';
import { Hub } from '../Sentinel-Sognatore/Hub.js';

export interface Skill {
  name: string;
  description: string;
  content: string;
  path: string;
}

export class SkillRegistry {
  private static instance: SkillRegistry;
  private skillsPath: string;
  private skills: Map<string, Skill> = new Map();

  private constructor() {
    const sognatoreRoot = Hub.getInstance().getSognatoreRoot();
    this.skillsPath = path.join(sognatoreRoot, 'resources', 'skills');
    this.reload();
  }

  static getInstance(): SkillRegistry {
    if (!SkillRegistry.instance) {
      SkillRegistry.instance = new SkillRegistry();
    }
    return SkillRegistry.instance;
  }

  private _validateSkill(content: string, filePath?: string): { valid: boolean; name: string; id: string; errors: string[] } {
    const errors: string[] = [];
    
    // 1. Extract YAML frontmatter
    const yamlRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(yamlRegex);
    if (!match) {
      errors.push('Falta el bloque YAML frontmatter delimitado por --- al inicio del archivo.');
      return { valid: false, name: '', id: '', errors };
    }
    
    const yamlContent = match[1];
    const lines = yamlContent.split(/\r?\n/);
    const metadata: Record<string, string> = {};
    
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.substring(0, colonIdx).trim();
        const val = line.substring(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        metadata[key] = val;
      }
    }
    
    // 2. Validate mandatory frontmatter properties
    if (metadata.type !== 'skill') {
      errors.push(`La propiedad 'type' en el frontmatter debe ser exactamente 'skill'. Recibido: '${metadata.type || ''}'`);
    }
    if (!metadata.name) {
      errors.push("Falta la propiedad obligatoria 'name' en el frontmatter.");
    }
    if (!metadata.id) {
      errors.push("Falta la propiedad obligatoria 'id' en el frontmatter.");
    } else if (!/^skill-[a-z0-9-]+$/.test(metadata.id)) {
      errors.push(`La propiedad 'id' ('${metadata.id}') debe seguir el formato '^skill-[a-z0-9-]+$'.`);
    }
    if (!metadata.description) {
      errors.push("Falta la propiedad obligatoria 'description' en el frontmatter.");
    }
    if (!metadata['allowed-tools']) {
      errors.push("Falta la propiedad obligatoria 'allowed-tools' en el frontmatter.");
    }
    
    // 3. Validate Markdown structure
    const cleanContent = content.replace(yamlRegex, '').trim();
    
    // Validate H1 header
    const h1Match = cleanContent.match(/^#\s+(.*)/m);
    if (!h1Match) {
      errors.push('Falta la cabecera principal H1 (# Título de Habilidad).');
    } else if (metadata.name) {
      const normalizedH1 = h1Match[1].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedName = metadata.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!normalizedH1.includes(normalizedName) && !normalizedName.includes(normalizedH1)) {
        errors.push(`El título H1 ('${h1Match[1].trim()}') no coincide razonablemente con el 'name' del frontmatter ('${metadata.name}').`);
      }
    }
    
    // Validate Decision Checklist section
    const hasChecklist = /decision checklist/i.test(cleanContent);
    if (!hasChecklist) {
      errors.push("Falta la sección obligatoria '## Decision Checklist'.");
    }
    
    // Validate Anti-Patterns section
    const hasAntiPatterns = /anti-pattern/i.test(cleanContent) || /anti\s*patterns/i.test(cleanContent);
    if (!hasAntiPatterns) {
      errors.push("Falta la sección obligatoria '## Anti-Patterns'.");
    }
    
    // 4. Validate script references inside ## Script / ## Scripts section
    const hasScriptSection = /##\s*Scripts?/i.test(cleanContent);
    if (hasScriptSection && filePath) {
      const lines = cleanContent.split('\n');
      let inScriptSection = false;
      for (const line of lines) {
        if (/^##\s*Scripts?/i.test(line)) {
          inScriptSection = true;
          continue;
        }
        if (inScriptSection && /^##?/.test(line) && !/^##\s*Scripts?/i.test(line)) {
          inScriptSection = false; // Left the scripts section
        }
        
        if (inScriptSection && line.includes('|')) {
          const scriptMatch = line.match(/`?(scripts\/[a-zA-Z0-9_\-\.]+)/i);
          if (scriptMatch) {
            const scriptRelPath = scriptMatch[1];
            const scriptName = path.basename(scriptRelPath);
            const skillDir = path.dirname(filePath);
            const resolvedScriptPath = path.join(skillDir, 'scripts', scriptName);
            if (!fs.existsSync(resolvedScriptPath)) {
              errors.push(`El script listado '${scriptRelPath}' no existe físicamente en el subdirectorio de scripts de la habilidad.`);
            }
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      name: metadata.name || '',
      id: metadata.id || '',
      errors
    };
  }

  /**
   * Reload all skills from the skills/ directory recursively.
   */
  async reload() {
    if (!fs.existsSync(this.skillsPath)) return;

    // Load Audit Registry (SBP: Reference root  memory)
    const sognatoreRoot = Hub.getInstance().getSognatoreRoot();
    const registryPath = path.resolve(sognatoreRoot, '..', '..', '.sogna_memory', 'audit_registry.json');
    let auditRegistry = { verified_knowledge: { skills: [] } };
    if (fs.existsSync(registryPath)) {
      try {
        auditRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      } catch (e) {
        console.warn('[SKILL_REGISTRY] Failed to parse audit_registry.json. Defaulting to strict mode.');
      }
    }

    const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith('.md')) {
          arrayOfFiles.push(fullPath);
        }
      });

      return arrayOfFiles;
    };

    // 1. Load legacy skills from resources/skills
    const files = getAllFiles(this.skillsPath);
    
    for (const fullPath of files) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const fileBase = path.basename(fullPath, '.md');
      const isQuarantined = fullPath.includes('quarantine');
      
      // Extraction of skill name: Priority to yaml frontmatter 'name:', then H1, then filename
      const nameMatch = content.match(/name:\s*(.*)/) || content.match(/^#\s*(.*)/m);
      const name = nameMatch ? nameMatch[1].trim() : fileBase;

      // Verification Check
      if (isQuarantined) {
        const isVerified = (auditRegistry.verified_knowledge.skills as string[]).includes(name);
        if (!isVerified) {
          console.log(Color.yellow(`[SKILL_REGISTRY] Skipping unverified quarantined skill: ${name}`));
          continue;
        }
      }
      
      this.skills.set(name.toLowerCase(), {
        name,
        description: '', 
        content,
        path: fullPath
      });
    }

    // 2. Load and strictly validate Curator skills
    const curatorSkillsPath = path.resolve(sognatoreRoot, '..', 'Curator', 'skills');
    if (fs.existsSync(curatorSkillsPath)) {
      const entries = fs.readdirSync(curatorSkillsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (['scripts', 'tests', 'node_modules', '.git'].includes(entry.name)) continue;
          
          const skillFile = path.join(curatorSkillsPath, entry.name, 'SKILL.md');
          if (fs.existsSync(skillFile)) {
            const content = fs.readFileSync(skillFile, 'utf8');
            const res = this._validateSkill(content, skillFile);
            if (res.valid) {
              this.skills.set(res.name.toLowerCase(), {
                name: res.name,
                description: '',
                content,
                path: skillFile
              });
            } else {
              console.log(Color.yellow(`[SKILL_REGISTRY] Skipping invalid Curator skill '${entry.name}': ${res.errors.join(' | ')}`));
            }
          }
        }
      }
    }
    
    console.log(`[SKILL_REGISTRY] Hydrated ${this.skills.size} capabilities. Audit-gate active.`);
  }

  private watcher: fs.FSWatcher | null = null;

  async reloadHot() {
    this.skills.clear();
    await this.reload();
    console.log(Color.green(`[SKILL_REGISTRY] Hot Reload completed. ${this.skills.size} capabilities active.`));
  }

  startWatching() {
    if (this.watcher) return;
    
    const sognatoreRoot = Hub.getInstance().getSognatoreRoot();
    const curatorSkillsPath = path.resolve(sognatoreRoot, '..', 'Curator', 'skills');
    
    if (fs.existsSync(curatorSkillsPath)) {
      try {
        this.watcher = fs.watch(curatorSkillsPath, { recursive: true }, (eventType, filename) => {
          if (filename && filename.endsWith('.md')) {
            console.log(Color.cyan(`[SKILL_REGISTRY] Change detected in skill file: ${filename}. Triggering auto-reload...`));
            this.reloadHot().catch(err => {
              console.error(`[SKILL_REGISTRY] Auto-reload failed:`, err);
            });
          }
        });
        console.log(Color.green(`[SKILL_REGISTRY] File watcher successfully attached to ${curatorSkillsPath}`));
      } catch (e) {
        console.warn(`[SKILL_REGISTRY] Failed to start file watcher: ${(e as Error).message}`);
      }
    }
  }

  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log(`[SKILL_REGISTRY] File watcher detached.`);
    }
  }

  /**
   * Finds skills relevant to a specific task description.
   */
  findRelevantSkills(description: string): Skill[] {
    const relevant: Skill[] = [];
    const keywords = description.toLowerCase().split(/\W+/);
    
    for (const [name, skill] of this.skills) {
      // Very basic scoring: if name or part of content matches keywords
      if (keywords.some(k => name.includes(k) || skill.content.toLowerCase().includes(k))) {
        relevant.push(skill);
      }
    }
    
    return relevant;
  }

  getSkill(name: string): Skill | undefined {
    return this.skills.get(name.toLowerCase());
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }
}
