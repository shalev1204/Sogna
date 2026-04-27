import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as path from 'path';

export interface AssetMetadata {
  id: string;
  originalName: string;
  type: string;
  size: number;
  tags: string[];
  projectLink?: string;
  timestamp: string;
}

/**
 * AssetHub - Multimodal Memory Management.
 * Implemented as a Singleton for system-wide accessibility.
 */
export class AssetHub {
  private static instance: AssetHub;
  private assetsPath: string;
  private inventoryPath: string;

  private constructor(basePath: string) {
    this.assetsPath = path.resolve(basePath, 'assets');
    this.inventoryPath = path.join(this.assetsPath, 'inventory.json');
  }

  public static getInstance(basePath?: string): AssetHub {
    if (!AssetHub.instance) {
      AssetHub.instance = new AssetHub(basePath || process.cwd());
    }
    return AssetHub.instance;
  }

  public getManifest(): string | null {
    if (fs.existsSync(this.inventoryPath)) {
      return this.inventoryPath;
    }
    return null;
  }

  async initialize(): Promise<void> {
    if (!fs.existsSync(this.assetsPath)) {
      fs.mkdirSync(this.assetsPath, { recursive: true });
    }
    if (!fs.existsSync(this.inventoryPath)) {
      fs.writeFileSync(this.inventoryPath, JSON.stringify({ assets: [] }, null, 2));
    }
  }

  async registerAsset(filePath: string, project?: string): Promise<AssetMetadata> {
    const fileName = path.basename(filePath);
    const stats = await fsp.stat(filePath);
    const id = `asset_${Date.now()}`;
    const targetPath = path.join(this.assetsPath, `${id}_${fileName}`);

    await fsp.copyFile(filePath, targetPath);

    const metadata: AssetMetadata = {
      id,
      originalName: fileName,
      type: path.extname(fileName).slice(1),
      size: stats.size,
      tags: ['imported', project || 'general'],
      timestamp: new Date().toISOString()
    };

    const raw = await fsp.readFile(this.inventoryPath, 'utf8');
    const inventory = JSON.parse(raw);
    inventory.assets.push(metadata);
    await fsp.writeFile(this.inventoryPath, JSON.stringify(inventory, null, 2));

    return metadata;
  }
}
