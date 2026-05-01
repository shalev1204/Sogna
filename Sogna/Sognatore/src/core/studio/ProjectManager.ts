import fs from 'fs';
import path from 'path';

export interface ProjectState {
  id: string;
  blueprint: string;
  current_stage: string;
  playbook?: string;
  artifacts: Record<string, string>; // artifact_name -> file_path
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class ProjectManager {
  private static PROJECTS_DIR = path.join(process.cwd(), '.sognatore', 'projects');

  static initializeProject(id: string, blueprintName: string): ProjectState {
    if (!fs.existsSync(this.PROJECTS_DIR)) fs.mkdirSync(this.PROJECTS_DIR, { recursive: true });

    const state: ProjectState = {
      id,
      blueprint: blueprintName,
      current_stage: 'initial',
      artifacts: {},
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.saveProject(state);
    return state;
  }

  static getProject(id: string): ProjectState | undefined {
    const filePath = path.join(this.PROJECTS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return undefined;
    
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return undefined;
    }
  }

  static saveProject(state: ProjectState) {
    if (!fs.existsSync(this.PROJECTS_DIR)) fs.mkdirSync(this.PROJECTS_DIR, { recursive: true });
    state.updated_at = new Date().toISOString();
    fs.writeFileSync(path.join(this.PROJECTS_DIR, `${state.id}.json`), JSON.stringify(state, null, 2));
  }

  static addArtifact(id: string, name: string, filePath: string) {
    const project = this.getProject(id);
    if (!project) throw new Error(`Project ${id} not found.`);
    
    project.artifacts[name] = filePath;
    this.saveProject(project);
  }

  static advanceStage(id: string, nextStage: string) {
    const project = this.getProject(id);
    if (!project) throw new Error(`Project ${id} not found.`);
    
    project.current_stage = nextStage;
    this.saveProject(project);
  }
}
