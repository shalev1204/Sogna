/** @sentinel-ignore: GLOBAL - Required for hosting honeypot decoy content */
import fs from 'fs-extra';
import path from 'path';

export interface HoneypotConfig {
  path: string;
  content: string;
  type: 'config' | 'key' | 'env';
}

/**
 * Sognatore Honeypot Manager
 * Deploys realistic decoy files to trap malicious actors and unauthorized scripts.
 */
export class HoneypotManager {
  private baseDir: string;
  private decoys: HoneypotConfig[] = [
    {
      path: '.env.production',
      content: 'PRODUCTION_DB_PASSWORD=sk_live_51PzX...' + ' (DO NOT DELETE: CORE PROTECTION TOKEN)',
      type: 'env'
    },
    {
      path: 'resources/config/secrets.json',
      content: JSON.stringify({
        aws_access_key: 'AKIA_DECOY_TOKEN_REPLACEME',
        aws_secret_key: 'decoy_secret_key_active_monitoring'
      }, null, 2),
      type: 'config'
    },
    {
      path: 'memory/security/id_rsa',
      content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA76...DECOY...TOKEN...\n-----END RSA PRIVATE KEY-----',
      type: 'key'
    }
  ];

  constructor(baseDir: string = '.') {
    this.baseDir = path.resolve(baseDir);
  }

  /**
   * Deploys all decoys to their respective paths.
   */
  async deploy(): Promise<void> {
    for (const decoy of this.decoys) {
      const fullPath = path.join(this.baseDir, decoy.path);
      await fs.ensureDir(path.dirname(fullPath));
      
      // Only write if doesn't exist or is different (avoid constant file mutations)
      if (!(await fs.pathExists(fullPath))) {
        await fs.writeFile(fullPath, decoy.content, 'utf-8');
        console.log(`[HONEYPOT] Decoy deployed: ${decoy.path}`);
      }
    }
  }

  /**
   * Returns the list of honeypot paths to be monitored by Sentinel.
   */
  getHoneypotPaths(): string[] {
    return this.decoys.map(d => d.path);
  }
}
