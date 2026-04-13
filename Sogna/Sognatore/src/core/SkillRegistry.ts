import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

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
    this.skillsPath = path.join(process.cwd(), 'resources', 'skills');
    this.reload();
  }

  static getInstance(): SkillRegistry {
    if (!SkillRegistry.instance) {
      SkillRegistry.instance = new SkillRegistry();
    }
    return SkillRegistry.instance;
  }

  /**
   * Reload all skills from the skills/ directory recursively.
   */
  async reload() {
    if (!fs.existsSync(this.skillsPath)) return;

    // Load Audit Registry (SBP: Reference root sovereign memory)
    const registryPath = path.resolve(process.cwd(), '../../.sogna_memory/audit_registry.json');
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
          console.log(chalk.yellow(`[SKILL_REGISTRY] Skipping unverified quarantined skill: ${name}`));
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
    
    console.log(`[SKILL_REGISTRY] Hydrated ${this.skills.size} capabilities. Audit-gate active.`);
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
