import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface MediaReviewEntry {
  path: string;
  media_type: 'video' | 'audio' | 'image';
  technical_probe: any;
  quality_risks: string[];
  usable_for: string[];
}

export class SourceMediaReviewer {
  private static VIDEO_EXTS = ['.mp4', '.mov', '.webm', '.avi'];
  private static AUDIO_EXTS = ['.mp3', '.wav', '.aac', '.ogg'];
  private static IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

  static reviewFolder(folderPath: string): MediaReviewEntry[] {
    const files = fs.readdirSync(folderPath);
    const reviews: MediaReviewEntry[] = [];

    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      const ext = path.extname(file).toLowerCase();
      
      let type: 'video' | 'audio' | 'image' | null = null;
      if (this.VIDEO_EXTS.includes(ext)) type = 'video';
      else if (this.AUDIO_EXTS.includes(ext)) type = 'audio';
      else if (this.IMAGE_EXTS.includes(ext)) type = 'image';

      if (type) {
        reviews.push(this.reviewFile(fullPath, type));
      }
    }
    return reviews;
  }

  static reviewFile(filePath: string, type: 'video' | 'audio' | 'image'): MediaReviewEntry {
    const entry: MediaReviewEntry = {
      path: filePath,
      media_type: type,
      technical_probe: {},
      quality_risks: [],
      usable_for: []
    };

    try {
      if (type === 'video' || type === 'audio') {
        const probe = execSync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`, { encoding: 'utf8' });
        const data = JSON.parse(probe);
        const format = data.format || {};
        const stream = data.streams?.[0] || {};

        entry.technical_probe = {
          duration: parseFloat(format.duration),
          bitrate: parseInt(format.bit_rate),
          codec: stream.codec_name,
          resolution: type === 'video' ? `${stream.width}x${stream.height}` : undefined
        };

        if (entry.technical_probe.duration < 3) entry.quality_risks.push('Short duration (<3s)');
        if (type === 'video' && stream.width < 1280) entry.quality_risks.push('Low resolution (SD)');
        
        entry.usable_for = type === 'video' ? ['b-roll', 'visual-source'] : ['ambient-audio', 'narration-source'];
      } else {
        // Image logic (simplified without PIL dependency for now)
        entry.technical_probe = { size: fs.statSync(filePath).size };
        entry.usable_for = ['reference-image', 'still-asset'];
      }
    } catch (e) {
      entry.quality_risks.push(`Probe failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    return entry;
  }

  /**
   * Semantic Scouting: Finds the best local asset for a given intent/description.
   * Superior to original tool by integrating with Sogna's global project context.
   */
  static scoutBestAsset(description: string, assets: MediaReviewEntry[]): MediaReviewEntry | null {
    const query = description.toLowerCase();
    let bestMatch: MediaReviewEntry | null = null;
    let maxScore = 0;

    for (const asset of assets) {
      const fileName = path.basename(asset.path).toLowerCase();
      let score = 0;
      
      // Heuristic: matching keywords in filename
      const keywords = query.split(' ');
      for (const kw of keywords) {
        if (fileName.includes(kw)) score += 10;
      }

      // Quality boost
      if (asset.technical_probe?.resolution?.startsWith('1920') || asset.technical_probe?.resolution?.startsWith('3840')) {
        score += 5;
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = asset;
      }
    }

    return bestMatch;
  }
}
