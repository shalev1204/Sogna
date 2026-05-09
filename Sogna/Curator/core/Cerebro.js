/**
 * core: The central controller for Sogna's native engines.
 * Coordinates between Stylist, Navigator, Animator, and Assembler.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

class core {
  constructor() {
    this.enginesPath = path.join(process.cwd(), 'toolkit', 'engines');
    this.engines = {
      stylist: path.join(this.enginesPath, 'Stylist'),
      navigator: path.join(this.enginesPath, 'Navigator'),
      animator: path.join(this.enginesPath, 'Animator'),
      assembler: path.join(this.enginesPath, 'Assembler'),
    };
  }

  /**
   * Initialize all engines and verify health.
   */
  async wakeUp() {
    console.log('🧠 core: Initializing engines...');
for (const [name, path] of Object.entries(this.engines)) {
      if (!fs.existsSync(path)) {
throw new Error(`Engine [${name}] not found at ${path}`);
      }
    }
    return true;
  }

  /**
   * Use the Navigator engine to map the current architecture.
   */
  async mapArchitecture(targetDir = process.cwd()) {
    console.log(`🗺️  core: Navigator is mapping architecture in ${targetDir}...`);
    const pythonPath = path.join(process.cwd(), 'toolkit', 'engines');
    const command = `python -m Navigator update "${targetDir}"`;
    
    try {
      execSync(command, { 
        stdio: 'inherit', 
        env: { ...process.env, PYTHONPATH: pythonPath } 
      });
      return { status: 'mapped', graphPath: 'memory/Navigator/graph.json' };
    } catch (error) {
      console.error('❌ Navigator failed:', error.message);
      return null;
    }
  }

  /**
   * Use the Stylist engine to generate design reasoning.
   */
  async generateDesignSystem(query) {
    console.log(`🎨 core: Stylist is generating design system for: "${query}"...`);
    const script = path.join(this.engines.stylist, 'scripts', 'design_system.py');
    try {
      const result = execSync(`python "${script}" "${query}" --format markdown`, { 
        encoding: 'utf-8',
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });
      
      // Save results to memory
      const designDir = path.join(process.cwd(), 'memory', 'designs');
      if (!fs.existsSync(designDir)) fs.mkdirSync(designDir, { recursive: true });
      fs.writeFileSync(path.join(designDir, 'last_reasoning.md'), result);
      
      return { status: 'styled', output: result };
    } catch (error) {
      console.error('❌ Stylist failed:', error.message);
      return null;
    }
  }

}

export default new core();
