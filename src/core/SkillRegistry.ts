import path from 'path';
import fs from 'fs';

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
   * Reloadall skills from the skills/ directory.
   */
  async reload() {
    if (!fs.existsSync(this.skillsPath)) return;

    const files = fs.readdirSync(this.skillsPath).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const fullPath = path.join(this.skillsPath, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic extraction of skill name from YAML frontmatter or title
      const nameMatch = content.match(/name:\s*(.*)/) || content.match(/^#\s*(.*)/m);
      const name = nameMatch ? nameMatch[1].trim() : path.basename(file, '.md');
      
      this.skills.set(name.toLowerCase(), {
        name,
        description: '', // Could be extracted too
        content,
        path: fullPath
      });
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
}
