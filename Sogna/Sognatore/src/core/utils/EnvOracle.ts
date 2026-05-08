import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

/**
 * EnvOracle - Smart Environment Discovery utility.
 * Recursively searches for .env files up the directory tree
 * to support centralized configuration in nested project structures.
 */
export class EnvOracle {
  /**
   * Discovers and loads the nearest .env file found by traversing upwards.
   * @param startPath The directory to start searching from. Defaults to process.cwd().
   */
  static load(startPath: string = process.cwd()): string | null {
    let currentPath = path.resolve(startPath);
    const root = path.parse(currentPath).root;

    while (currentPath !== root) {
      const envPath = path.join(currentPath, '.env');
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log(chalk.dim(`[ENV] Oracle discovered configuration at: ${envPath}`));
        return envPath;
      }
      currentPath = path.dirname(currentPath);
    }

    // Check root as last resort
    const rootEnv = path.join(root, '.env');
    if (fs.existsSync(rootEnv)) {
       dotenv.config({ path: rootEnv });
       return rootEnv;
    }

    return null;
  }

  /**
   * Alias for load() to make usage clearer in security audits.
   */
  static pushToProcessEnv(startPath: string = process.cwd()): string | null {
    return this.load(startPath);
  }
}
