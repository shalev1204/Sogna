import { ToolStatus } from './StudioEngine.js';

export interface ProviderInfo {
  name: string;
  provider: string;
  best_for: string[];
  supports: Record<string, any>;
  stability: 'production' | 'beta' | 'experimental';
  tier: 'generate' | 'edit' | 'process';
  runtime: 'api' | 'local' | 'hybrid';
  historical_success_rate?: number;
  latency_p50_seconds?: number;
  quality_score?: number;
}

export interface ProviderScore {
  tool_name: string;
  provider: string;
  task_fit: number;
  output_quality: number;
  control: number;
  reliability: number;
  cost_efficiency: number;
  latency: number;
  continuity: number;
  weighted_score: number;
}

export interface TaskContext {
  intent: string;
  style_keywords?: string[];
  budget_remaining_usd?: number;
  locked_providers?: string[];
  motion_required?: boolean;
  asset_type?: 'image' | 'video' | 'audio' | 'music' | 'voice';
  operation?: string;
  prompt?: string;
  quality_weight?: number;
  control_weight?: number;
  reliability_weight?: number;
  max_cost?: number;
  max_latency?: number;
}

const SYNONYM_CLUSTERS = [
  ['cinematic', 'film', 'movie', 'trailer', 'dramatic', 'epic'],
  ['explainer', 'educational', 'tutorial', 'teaching', 'lesson'],
  ['corporate', 'business', 'professional', 'enterprise'],
  ['social', 'tiktok', 'instagram', 'reels', 'shorts', 'viral'],
  ['animation', 'animated', 'motion-graphics', 'motion', 'kinetic'],
  ['pixar', 'animation', 'animated', 'stylized', 'storybook', 'character'],
  ['realistic', 'photorealistic', 'lifelike', 'natural'],
  ['stock', 'footage', 'b-roll', 'library'],
  ['avatar', 'presenter', 'talking-head', 'spokesperson'],
  ['voiceover', 'narration', 'speech', 'voice'],
  ['music', 'soundtrack', 'background-music', 'score', 'ambient'],
];

const GENERATED_VISUAL_TERMS = new Set([
  'animated', 'animation', 'anime', 'cartoon', 'character', 'cinematic',
  'concept', 'fantasy', 'ghibli', 'illustration', 'pixar', 'render',
  'scifi', 'short', 'story', 'stylized', 'surreal'
]);

const REFERENCE_TERMS = new Set([
  'character', 'consistency', 'identity', 'preserve', 'product',
  'reference', 'subject', 'wardrobe'
]);

export class ScoringEngine {
  static tokenize(text: string): string[] {
    return (text || '').toLowerCase().match(/[a-z0-9][a-z0-9+._-]*/g) || [];
  }

  static expandSynonyms(words: Set<string>): Set<string> {
    const expanded = new Set(words);
    for (const cluster of SYNONYM_CLUSTERS) {
      if ([...expanded].some(w => cluster.includes(w))) {
        cluster.forEach(w => expanded.add(w));
      }
    }
    return expanded;
  }

  static keywordOverlap(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const smaller = Math.min(setA.size, setB.size);
    return smaller > 0 ? intersection.size / smaller : 0;
  }

  static computeTaskFit(bestFor: string[], intent: string, styleKeywords: string[]): number {
    if (!bestFor || bestFor.length === 0) return 0.3;

    const intentWords = this.expandSynonyms(new Set(this.tokenize(intent)));
    const bestForWords = new Set<string>();
    bestFor.forEach(desc => this.tokenize(desc).forEach(t => bestForWords.add(t)));
    const expandedBestFor = this.expandSynonyms(bestForWords);

    const intentScore = this.keywordOverlap(intentWords, expandedBestFor);
    const styleWords = this.expandSynonyms(new Set(styleKeywords.map(k => k.toLowerCase())));
    const styleScore = this.keywordOverlap(styleWords, expandedBestFor);

    return Math.min(1.0, intentScore * 0.7 + styleScore * 0.3 + 0.1);
  }

  static computeControl(supports: Record<string, any>): number {
    const controlFeatures: [string, number][] = [
      ['controlnet', 2.0],
      ['reference_image', 1.8],
      ['style_transfer', 1.5],
      ['inpainting', 1.5],
      ['img2img', 1.3],
      ['negative_prompt', 1.0],
      ['custom_size', 0.8],
      ['aspect_ratio', 0.7],
      ['seed', 0.5],
    ];

    if (!supports) return 0.3;
    const totalWeight = controlFeatures.reduce((acc, [_, w]) => acc + w, 0);
    const earned = controlFeatures.reduce((acc, [f, w]) => acc + (supports[f] ? w : 0), 0);
    return Math.min(1.0, earned / (totalWeight * 0.5));
  }

  static scoreProvider(info: ProviderInfo, status: ToolStatus, context: TaskContext): ProviderScore {
    const taskFit = this.computeTaskFit(info.best_for, context.intent, context.style_keywords || []);

    // Reliability
    let reliability = 0;
    if (info.historical_success_rate !== undefined) {
      reliability = info.historical_success_rate;
    } else if (status === ToolStatus.AVAILABLE) {
      reliability = info.stability === 'production' ? 0.95 : 0.8;
    } else if (status === ToolStatus.DEGRADED) {
      reliability = 0.4;
    }

    // Control
    const control = this.computeControl(info.supports);

    // Cost efficiency (heuristic)
    let costEfficiency: number;
    if (info.runtime === 'local') costEfficiency = 1.0;
    else if (info.tier === 'generate') costEfficiency = 0.4;
    else costEfficiency = 0.7;

    // Latency
    let latency = 0.4;
    if (info.latency_p50_seconds !== undefined) {
      const p50 = info.latency_p50_seconds;
      if (p50 <= 1.0) latency = 1.0;
      else if (p50 <= 10.0) latency = 0.8;
      else if (p50 <= 30.0) latency = 0.6;
      else if (p50 <= 60.0) latency = 0.4;
      else latency = 0.2;
    } else {
      if (info.runtime === 'local') latency = 0.9;
      else if (info.runtime === 'hybrid') latency = 0.6;
    }

    // Continuity
    let continuity = 0.5;
    if (context.locked_providers && context.locked_providers.includes(info.provider)) {
      continuity = 0.9;
    }

    // Output quality
    let outputQuality = info.quality_score !== undefined ? info.quality_score : 0.5;
    if (info.quality_score === undefined) {
      const qualityMap = { production: 0.9, beta: 0.7, experimental: 0.4 };
      outputQuality = qualityMap[info.stability] || 0.5;
      if (info.tier === 'generate' && info.stability === 'production') {
        outputQuality = Math.min(1.0, outputQuality + 0.05);
      }
    }

    const weightedScore = (
      taskFit * 0.30 +
      outputQuality * 0.20 +
      control * 0.15 +
      reliability * 0.15 +
      costEfficiency * 0.10 +
      latency * 0.05 +
      continuity * 0.05
    );

    return {
      tool_name: info.name,
      provider: info.provider,
      task_fit: taskFit,
      output_quality: outputQuality,
      control: control,
      reliability: reliability,
      cost_efficiency: costEfficiency,
      latency: latency,
      continuity: continuity,
      weighted_score: weightedScore
    };
  }

  static rankProviders(providers: {info: ProviderInfo, status: ToolStatus}[], context: TaskContext): ProviderScore[] {
    return providers
      .map(p => this.scoreProvider(p.info, p.status, context))
      .sort((a, b) => b.weighted_score - a.weighted_score);
  }
}
