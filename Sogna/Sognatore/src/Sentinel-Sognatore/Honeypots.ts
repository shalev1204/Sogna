import { FS as fs, sentinelDir } from '@Sogna/Curator';
/** @Sentinel-ignore: GLOBAL - Required for hosting honeypot decoy content */

import path from 'path';
import { Hub } from './Hub.js';
import { resolveInstitutionalRoot } from '../core/utils/InstitutionalRoot.js';

export interface HoneypotConfig {
  path: string;
  content: string;
  type: 'config' | 'key' | 'env';
}

/**
 * Sentinel Honeypots - Decoy system part of the Sentinel-Sognatore block.
 * Deploys realistic decoy files to trap malicious actors and unauthorized scripts.
 */
export class Honeypots {
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
    this._loadCentralDecoys();
  }

  private _loadCentralDecoys(): void {
    const centralPath = sentinelDir(resolveInstitutionalRoot(this.baseDir), 'data', 'honeypots.json');
    if (fs.existsSync(centralPath)) {
      try {
        const data = fs.readJsonSync(centralPath);
        if (data && data.decoys) {
          data.decoys.forEach((p: string) => {
            if (!this.decoys.find(d => d.path === p)) {
              this.decoys.push({
                path: p,
                content: `SENTINEL_DECOY_${Buffer.from(p).toString('hex').substring(0, 8)}`,
                type: 'config'
              });
            }
          });
        }
      } catch (e) {
        console.warn('[SENTINEL] Error cargando decoys centralizados:', e);
      }
    }
  }

  async loadCentralDecoysAsync(): Promise<void> {
    const centralPath = sentinelDir(resolveInstitutionalRoot(this.baseDir), 'data', 'honeypots.json');
    if (await fs.pathExists(centralPath)) {
      try {
        const data = await fs.readJson(centralPath);
        if (data && data.decoys) {
          data.decoys.forEach((p: string) => {
            if (!this.decoys.find(d => d.path === p)) {
              this.decoys.push({
                path: p,
                content: `SENTINEL_DECOY_${Buffer.from(p).toString('hex').substring(0, 8)}`,
                type: 'config'
              });
            }
          });
        }
      } catch (e) {
        console.warn('[SENTINEL] Error cargando decoys centralizados:', e);
      }
    }
  }

  /**
   * Deploys all decoys to their respective paths.
   */
  async deploy(): Promise<void> {
    await this.loadCentralDecoysAsync();
    for (const decoy of this.decoys) {
      const fullPath = path.join(this.baseDir, decoy.path);
      await fs.ensureDir(path.dirname(fullPath));
      
      if (!(await fs.pathExists(fullPath))) {
        await fs.writeFile(fullPath, decoy.content, 'utf-8');
        Hub.getInstance().reportIntel('INFO', `Señuelo desplegado: ${decoy.path}`, 'Honeypots');
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


