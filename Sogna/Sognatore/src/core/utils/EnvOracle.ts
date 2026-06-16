import { Color, Env } from '@Sogna/Curator';
import * as fs from 'fs';
import * as path from 'path';



/**
 * EnvOracle - Smart Environment Discovery utility.
 * Recursively searches for .env files up the directory tree
 * to support centralized configuration in nested project structures.
 */
export class EnvOracle {
  private static loadedPath: string | null | undefined;

  /**
   * Discovers and loads the nearest .env file found by traversing upwards.
   * @param startPath The directory to start searching from. Defaults to process.cwd().
   */
  static load(startPath: string = process.cwd()): string | null {
    if (this.loadedPath !== undefined) {
      return this.loadedPath;
    }

    let currentPath = path.resolve(startPath);
    const root = path.parse(currentPath).root;
    const quiet = process.env.SOGNA_QUIET === 'true';

    while (currentPath !== root) {
      const envPath = path.join(currentPath, '.env');
      if (fs.existsSync(envPath)) {
        Env.load(envPath );
        if (!quiet) {
          console.log(Color.dim(`[ENV] Oracle discovered configuration at: ${envPath}`));
        }
        this.loadedPath = envPath;
        return envPath;
      }
      currentPath = path.dirname(currentPath);
    }

    // Check root as last resort
    const rootEnv = path.join(root, '.env');
    if (fs.existsSync(rootEnv)) {
       Env.load(rootEnv );
       this.loadedPath = rootEnv;
       return rootEnv;
    }

    this.loadedPath = null;
    return null;
  }

  /**
   * Alias for load() to make usage clearer in security audits.
   */
  static pushToProcessEnv(startPath: string = process.cwd()): string | null {
    return this.load(startPath);
  }
}
