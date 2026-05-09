import { readFileSync, readdirSync, existsSync, statSync, watch, FSWatcher } from 'fs';
import { join, extname } from 'path';
import { PluginSentinel } from './Sentinel.js';
import { 
  PluginConfig, 
  PluginLoaderReport, 
  LoadedPlugin, 
  FailedPlugin 
} from './PluginTypes.js';

/**
 * Single YAML value parsing (string, number, boolean, null).
 */
export function parseYAMLValue(raw: string): any {
  if (raw === '' || raw === 'null' || raw === '~') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;

  // Quoted strings
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }

  // Numbers
  if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
  if (/^-?\d+\.\d+$/.test(raw)) return parseFloat(raw);

  return raw;
}

/**
 * Simple YAML parser for plugin configs.
 */
export function parseSimpleYAML(content: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = content.split('\n');
  let currentKey: string | null = null;
  let multilineValue: string | null = null;
  let multilineIndent = 0;
  let arrayKey: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and comments (unless in multiline mode)
    if (!multilineValue && (line.trim() === '' || line.trim().startsWith('#'))) {
      continue;
    }

    // Handle multiline string continuation
    if (multilineValue !== null && currentKey) {
      const stripped = line;
      const indent = stripped.length - stripped.trimStart().length;
      if (indent >= multilineIndent && stripped.trim() !== '') {
        if (result[currentKey] === '') {
          result[currentKey] = stripped.trimStart();
        } else {
          result[currentKey] += '\n' + stripped.trimStart();
        }
        continue;
      } else {
        // End of multiline
        multilineValue = null;
        if (line.trim() === '') continue;
      }
    }

    // Handle array items
    const arrayMatch = line.match(/^(\s+)- (.+)$/);
    if (arrayMatch && arrayKey) {
      if (!Array.isArray(result[arrayKey])) {
        result[arrayKey] = [];
      }
      result[arrayKey].push(parseYAMLValue(arrayMatch[2].trim()));
      continue;
    }

    // Handle key-value pairs
    const kvMatch = line.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.*)$/i);
    if (kvMatch) {
      const key = kvMatch[1];
      const rawValue = kvMatch[2].trim();

      // Check for multiline indicator
      if (rawValue === '|' || rawValue === '>') {
        currentKey = key;
        multilineValue = '';
        multilineIndent = 2; // expect at least 2-space indent
        result[key] = '';
        arrayKey = null;
        continue;
      }

      // Check if next line starts an array
      if (rawValue === '' && i + 1 < lines.length && lines[i + 1].match(/^\s+- /)) {
        arrayKey = key;
        result[key] = [];
        continue;
      }

      result[key] = parseYAMLValue(rawValue);
      currentKey = key;
      arrayKey = null;
    }
  }

  return result;
}

export class PluginLoader {
  private pluginsDir: string;
  private sentinel: PluginSentinel;
  private _watchers: FSWatcher[] = [];

  /**
   * Create a new PluginLoader.
   * @param pluginsDir - Path to plugins directory
   * @param schemasDir - Path to schemas directory
   */
  constructor(pluginsDir?: string, schemasDir?: string) {
    this.pluginsDir = pluginsDir || '.sognatore/plugins';
    this.sentinel = new PluginSentinel(schemasDir);
  }

  /**
   * Discover plugin files in the plugins directory.
   */
  public discover(): string[] {
    if (!existsSync(this.pluginsDir)) {
      return [];
    }

    try {
      const stat = statSync(this.pluginsDir);
      if (!stat.isDirectory()) {
        return [];
      }
    } catch {
      return [];
    }

    try {
      const entries = readdirSync(this.pluginsDir);
      const pluginFiles: string[] = [];

      for (const entry of entries) {
        const ext = extname(entry).toLowerCase();
        if (ext === '.yaml' || ext === '.yml' || ext === '.json') {
          pluginFiles.push(join(this.pluginsDir, entry));
        }
      }

      return pluginFiles.sort();
    } catch {
      return [];
    }
  }

  /**
   * Parse a plugin file (YAML or JSON).
   */
  private _parseFile(filePath: string): any | null {
    try {
      const content = readFileSync(filePath, 'utf8');
      const ext = extname(filePath).toLowerCase();

      if (ext === '.json') {
        return JSON.parse(content);
      }

      // YAML parsing
      return parseSimpleYAML(content);
    } catch (err) {
      return null;
    }
  }

  /**
   * Load all plugins from the plugins directory.
   */
  public loadAll(): PluginLoaderReport {
    const files = this.discover();
    const loaded: LoadedPlugin[] = [];
    const failed: FailedPlugin[] = [];

    for (const filePath of files) {
      try {
        const config = this._parseFile(filePath);

        if (!config) {
          failed.push({ path: filePath, errors: ['Failed to parse plugin file'] });
          continue;
        }

        const result = this.sentinel.validate(config);

        if (result.valid) {
          loaded.push({ path: filePath, config: config as PluginConfig });
        } else {
          failed.push({ path: filePath, errors: result.errors });
        }
      } catch (err: any) {
        failed.push({ path: filePath, errors: [err.message || 'Unknown error'] });
      }
    }

    return { loaded, failed };
  }

  /**
   * Load a single plugin file.
   */
  public loadOne(filePath: string): { config: PluginConfig | null, errors: string[] } {
    const config = this._parseFile(filePath);

    if (!config) {
      return { config: null, errors: ['Failed to parse plugin file'] };
    }

    const result = this.sentinel.validate(config);

    if (result.valid) {
      return { config: config as PluginConfig, errors: [] };
    }

    return { config: null, errors: result.errors };
  }

  /**
   * Watch the plugins directory for changes.
   */
  public watchForChanges(callback: (eventType: string, filePath: string) => void): () => void {
    if (!existsSync(this.pluginsDir)) {
      return () => {};
    }

    try {
      const watcher = watch(this.pluginsDir, (eventType: string, filename: string | null) => {
        if (!filename) return;

        const ext = extname(filename).toLowerCase();
        if (ext === '.yaml' || ext === '.yml' || ext === '.json') {
          const filePath = join(this.pluginsDir, filename);
          callback(eventType, filePath);
        }
      });

      this._watchers.push(watcher);

      return () => {
        watcher.close();
        const idx = this._watchers.indexOf(watcher);
        if (idx >= 0) this._watchers.splice(idx, 1);
      };
    } catch {
      return () => {};
    }
  }

  /**
   * Stop all file watchers.
   */
  public stopWatching(): void {
    for (const watcher of this._watchers) {
      try { watcher.close(); } catch { /* ignore */ }
    }
    this._watchers = [];
  }
}
