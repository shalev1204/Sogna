import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class AssetCache {
  private static CACHE_FILE = path.join(process.cwd(), '.sognare', 'asset_cache.json');
  private static cache: Record<string, string> = {};

  static load() {
    if (fs.existsSync(this.CACHE_FILE)) {
      try {
        this.cache = JSON.parse(fs.readFileSync(this.CACHE_FILE, 'utf8'));
      } catch (e) {
        this.cache = {};
      }
    }
  }

  static save() {
    const dir = path.dirname(this.CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.CACHE_FILE, JSON.stringify(this.cache, null, 2));
  }

  static getUrl(filePath: string): string | null {
    const hash = this.getHash(filePath);
    return this.cache[hash] || null;
  }

  static setUrl(filePath: string, url: string) {
    const hash = this.getHash(filePath);
    this.cache[hash] = url;
    this.save();
  }

  private static getHash(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(buffer).digest('hex');
  }
}
