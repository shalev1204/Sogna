import * as fs from 'fs-extra';
import * as path from 'path';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  entryPoint: string;
}

/**
 * PluginManager - Orchestrating system extensibility.
 */
export class PluginManager {
  private pluginsPath: string;
  private activePlugins: Map<string, any> = new Map();

  constructor(basePath: string) {
    this.pluginsPath = path.resolve(basePath, 'plugins');
  }

  /**
   * Initializes and loads all plugins from the directory.
   */
  async loadPlugins(): Promise<void> {
    if (!await fs.pathExists(this.pluginsPath)) {
      await fs.ensureDir(this.pluginsPath);
      return;
    }

    const entries = await fs.readdir(this.pluginsPath);
    for (const entry of entries) {
      const manifestPath = path.join(this.pluginsPath, entry, 'manifest.json');
      if (await fs.pathExists(manifestPath)) {
        const manifest: PluginManifest = await fs.readJson(manifestPath);
        console.log(`[PluginManager] Loading plugin: ${manifest.name} v${manifest.version}`);
        this.activePlugins.set(manifest.id, manifest);
        // In a real scenario, we would dynamic import the entryPoint
      }
    }
  }

  /**
   * Returns a list of active system extensions.
   */
  getActiveExtensions(): PluginManifest[] {
    return Array.from(this.activePlugins.values());
  }
}
