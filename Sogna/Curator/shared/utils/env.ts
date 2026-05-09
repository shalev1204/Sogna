import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Sogna Native Environment Loader
 * Utilizes Node.js native env loading or a manual fallback for maximum control.
 */
export class Env {
  /**
   * Loads a .env file into process.env.
   * @param envPath Path to the .env file.
   * @param options Configuration options for loading.
   */
  static load(envPath: string = '.env', options: { quiet?: boolean; override?: boolean } = {}): void {
    const fullPath = resolve(envPath);
    if (!existsSync(fullPath)) {
      if (!options.quiet) {
        console.warn(`[ENV] Configuration file not found: ${fullPath}`);
      }
      return;
    }

    try {
      // Use native Node.js 20+ loader if available
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(fullPath);
      } else {
        // Manual fallback for older environments
        const content = readFileSync(fullPath, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const [key, ...values] = trimmed.split('=');
          if (key) {
            const varName = key.trim();
            if (options.override || !process.env[varName]) {
              process.env[varName] = values.join('=').trim().replace(/^["']|["']$/g, '');
            }
          }
        });
      }
    } catch (error) {
      console.error(`[ENV] Failed to load configuration at ${fullPath}:`, error);
    }
  }

  /**
   * Discovers and loads the nearest .env file searching upwards.
   */
  static discover(startPath: string = process.cwd()): string | null {
    let current = resolve(startPath);
    const root = resolve('/');

    while (current !== root) {
      const envPath = resolve(current, '.env');
      if (existsSync(envPath)) {
        this.load(envPath);
        return envPath;
      }
      const parent = resolve(current, '..');
      if (parent === current) break;
      current = parent;
    }
    return null;
  }
}
