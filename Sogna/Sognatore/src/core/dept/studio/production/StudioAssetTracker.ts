import fs from 'fs';
import path from 'path';

export interface StudioAsset {
    id: string;
    type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
    path: string;
    status: 'DRAFT' | 'RENDERED' | 'PUBLISHED';
    metadata: any;
    timestamp: string;
}

export class StudioAssetTracker {
    private static ASSET_PATH = path.join(process.cwd(), '.sognatore', 'Studio', 'assets.json');

    static registerAsset(asset: Omit<StudioAsset, 'id' | 'timestamp'>) {
        const assets = this.load();
        const newAsset: StudioAsset = {
            id: `asset_${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...asset
        };
        assets.push(newAsset);
        
        if (!fs.existsSync(path.dirname(this.ASSET_PATH))) {
            fs.mkdirSync(path.dirname(this.ASSET_PATH), { recursive: true });
        }
        
        fs.writeFileSync(this.ASSET_PATH, JSON.stringify(assets, null, 2));
        return newAsset;
    }

    static load(): StudioAsset[] {
        if (!fs.existsSync(this.ASSET_PATH)) return [];
        return JSON.parse(fs.readFileSync(this.ASSET_PATH, 'utf8'));
    }
}
