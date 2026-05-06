import fs from 'fs';
import path from 'path';
import { EnvOracle } from '../utils/EnvOracle.js';
import * as ModelRegistry from './ModelRegistry.js';
import { ScoringEngine, TaskContext, ProviderInfo } from './ScoringEngine.js';
import { PlaybookManager, Playbook } from './PlaybookManager.js';
import { StructuralValidator, Scene, ValidationReport } from './StructuralValidator.js';
import { DeliveryPromise, PromiseType, QualityTier } from './DeliveryPromise.js';

export enum ToolStatus {
  AVAILABLE = 'available',
  DEGRADED = 'degraded',
  UNAVAILABLE = 'unavailable'
}

export interface StudioGenerationResult {
  url: string;
  request_id: string;
  status: string;
  raw_response: any;
  provider?: string;
  model?: string;
}

/**
 * ShotPromptBuilder - Optimizes raw prompts for specific video/image engines.
 * Uses professional cinematography mappings for shot size, movement, and lighting.
 */
class ShotPromptBuilder {
  private static SHOT_SIZE_PHRASES: Record<string, string> = {
    extreme_wide: "extreme wide shot showing vast environment",
    wide: "wide shot capturing full scene",
    medium: "medium shot from waist up",
    close_up: "close-up focusing on face or detail",
    extreme_close_up: "extreme close-up on fine detail"
  };

  private static MOVEMENT_PHRASES: Record<string, string> = {
    pan: "smooth pan movement",
    tilt: "gentle tilt movement",
    dolly: "slow dolly movement",
    tracking: "tracking shot following subject",
    handheld: "handheld camera with natural movement"
  };

  private static LIGHTING_PHRASES: Record<string, string> = {
    high_key: "bright high-key lighting, minimal shadows",
    low_key: "dramatic low-key lighting with deep shadows",
    golden_hour: "warm golden hour sunlight",
    neon: "neon-lit with vibrant color spill",
    volumetric: "volumetric light with visible rays"
  };

  static optimize(prompt: string, modelId: string): string {
    let p = prompt.trim();
    
    // Auto-detect and expand shot/movement tags if present (e.g. "[shot:close_up]")
    for (const [tag, phrase] of Object.entries(this.SHOT_SIZE_PHRASES)) {
      if (p.includes(`[shot:${tag}]`)) p = p.replace(`[shot:${tag}]`, phrase);
    }
    for (const [tag, phrase] of Object.entries(this.MOVEMENT_PHRASES)) {
      if (p.includes(`[move:${tag}]`)) p = p.replace(`[move:${tag}]`, phrase);
    }
    for (const [tag, phrase] of Object.entries(this.LIGHTING_PHRASES)) {
      if (p.includes(`[light:${tag}]`)) p = p.replace(`[light:${tag}]`, phrase);
    }

    // Engine-specific defaults
    if (modelId.includes('seedance')) {
      if (!p.toLowerCase().includes('cinematic')) p = `${p}, cinematic lighting, 4k, highly detailed, professional production`;
    }
    if (modelId.includes('veo')) {
      if (!p.toLowerCase().includes('realistic')) p = `${p}, photorealistic, natural lighting, high dynamic range`;
    }
    if (modelId.includes('kling')) {
      if (!p.toLowerCase().includes('physics')) p = `${p}, realistic physics, smooth motion, high fidelity`;
    }

    return p;
  }
}

export class StudioEngine {
  private baseUrl = 'https://api.muapi.ai/api/v1';

  private getApiKey(): string {
    EnvOracle.load();
    const key = process.env.MUAPI_KEY;
    if (!key) {
      throw new Error('[StudioEngine] MUAPI_KEY is missing. Configure it in .env.');
    }
    return key as string;
  }

  /**
   * Selects the best model for a given task using the ScoringEngine.
   */
  selectBestModel(context: TaskContext): string {
    const allModels = ModelRegistry.getAllModels();
    const providers = allModels.map(m => ({
      info: m as unknown as ProviderInfo,
      status: ToolStatus.AVAILABLE // Assume available for selection
    }));

    const rankings = ScoringEngine.rankProviders(providers, context);
    if (rankings.length === 0) return 'seedream'; // Fallback to stable T2I
    
    console.log(`[StudioEngine] Best model selected: ${rankings[0].tool_name} (Score: ${rankings[0].weighted_score.toFixed(2)})`);
    return rankings[0].tool_name;
  }

  /**
   * Validates a scene plan for structural variety and pacing.
   */
  async validateScenePlan(scenes: Scene[]): Promise<ValidationReport> {
    console.log(`[STUDIO_ENGINE] Validating structural integrity of ${scenes.length} scenes...`);
    return StructuralValidator.validate(scenes);
  }

  /**
   * Applies a playbook style to a prompt.
   */
  applyPlaybook(prompt: string, playbookName: string): string {
    const playbook = PlaybookManager.getPlaybook(playbookName);
    if (!playbook) return prompt;
    
    return `${playbook.asset_generation.image_prompt_prefix}, ${prompt}`;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal as any });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  }

  private async pollForResult(requestId: string, maxAttempts = 600, intervalMs = 2000): Promise<any> {
    const key = this.getApiKey();
    const pollUrl = `${this.baseUrl}/predictions/${requestId}/result`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(res => setTimeout(res, intervalMs));
      
      try {
        const response = await this.fetchWithTimeout(pollUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'x-api-key': key }
        });

        if (!response.ok) {
          if (response.status >= 500) continue; // Retry on server error
          const errText = await response.text();
          console.warn(`[StudioEngine] Poll error (${response.status}):`, errText);
          if (attempt === maxAttempts) throw new Error(`[StudioEngine] Poll failed: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const status = data.status?.toLowerCase();

        if (['completed', 'succeeded', 'success'].includes(status)) return data;
        if (['failed', 'error'].includes(status)) {
          throw new Error(`[StudioEngine] Generation failed: ${data.error || 'Unknown error'}`);
        }
        
        if (attempt % 10 === 0) {
            console.log(`[StudioEngine] Polling task ${requestId} (Attempt ${attempt}/${maxAttempts})...`);
        }
      } catch (error: any) {
        if (attempt === maxAttempts) throw error;
      }
    }
    throw new Error('[StudioEngine] Generation timed out.');
  }

  /**
   * Uploads a local file to Muapi storage with deduplication.
   */
  async uploadFile(filePath: string): Promise<string> {
    const { AssetCache } = await import('./AssetCache.js');
    AssetCache.load();
    
    const cachedUrl = AssetCache.getUrl(filePath);
    if (cachedUrl) {
      console.log(`[StudioEngine] Asset found in cache: ${path.basename(filePath)}`);
      return cachedUrl;
    }

    const key = this.getApiKey();
    const url = `${this.baseUrl}/upload_file`;
    
    if (!fs.existsSync(filePath)) throw new Error(`[StudioEngine] File not found: ${filePath}`);
    
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    
    const formData = new FormData();
    formData.append('file', blob, fileName);

    console.log(`[StudioEngine] Uploading NEW asset: ${fileName}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'x-api-key': key },
      body: formData
    });

    if (!response.ok) throw new Error(`[StudioEngine] Upload failed: ${await response.text()}`);
    
    const data = await response.json();
    const fileUrl = data.url || data.file_url || data.data?.url;
    if (!fileUrl) throw new Error('[StudioEngine] Upload response missing URL');
    
    AssetCache.setUrl(filePath, fileUrl);
    return fileUrl;
  }

  /**
   * Universal Generate method that routes to specific logic based on model and params.
   * Now integrates Playbook style anchors and Quality Tier commitments.
   */
  async generate(params: any): Promise<StudioGenerationResult> {
    // 1. Playbook Application & Consistency Anchors
    if (params.playbook) {
      const playbook = PlaybookManager.getPlaybook(params.playbook);
      if (playbook) {
        params.prompt = this.applyPlaybook(params.prompt, params.playbook);
        // Inject consistency anchors to keep style across shots
        const anchors = playbook.asset_generation.consistency_anchors.join(', ');
        params.prompt = `${params.prompt}, ${anchors}`;
      }
    }

    // 2. Intelligence Phase: If no model is specified, select the best one.
    if (!params.model) {
        const qualityWeight = params.quality === QualityTier.BROADCAST ? 0.9 : 0.6;
        params.model = this.selectBestModel({
            intent: params.prompt || 'general generation',
            asset_type: params.asset_type || 'video',
            motion_required: params.asset_type === 'video',
            quality_weight: qualityWeight,
            operation: params.operation
        });
    }

    // 3. Optimization Phase: Enhance prompt for the selected engine.
    params.prompt = ShotPromptBuilder.optimize(params.prompt, params.model);

    const modelId = params.model;
    
    // 4. Execution Phase
    if (ModelRegistry.getLipSyncModelById(modelId)) return this.processLipSync(params);
    if (ModelRegistry.getV2VModelById(modelId)) return this.processV2V(params);
    if (ModelRegistry.getI2VModelById(modelId)) return this.processI2V(params);
    if (ModelRegistry.getI2IModelById(modelId)) return this.processI2I(params);
    if (ModelRegistry.getVideoModelById(modelId)) return this.processT2V(params);
    
    // Default to T2I
    return this.processT2I(params);
  }

  private async processT2I(params: any): Promise<StudioGenerationResult> {
    const modelInfo = ModelRegistry.getModelById(params.model) as any;
    const endpoint = modelInfo?.endpoint || params.model;
    const url = `${this.baseUrl}/${endpoint}`;
    
    const payload: any = {
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio || '1:1',
      num_images: params.num_images || 1
    };
    if (params.image_url) {
        payload.image_url = params.image_url;
        payload.strength = params.strength || 0.6;
    }
    if (params.seed && params.seed !== -1) payload.seed = params.seed;

    return this.submitAndPoll(url, payload, 'Image');
  }

  private async processT2V(params: any): Promise<StudioGenerationResult> {
    const modelInfo = ModelRegistry.getVideoModelById(params.model) as any;
    const endpoint = modelInfo?.endpoint || params.model;
    const url = `${this.baseUrl}/${endpoint}`;
    
    // Seedance 2.0 specific payload handling
    if (params.model === 'seedance-v2') {
        const payload: any = {
            prompt: params.prompt,
            aspect_ratio: params.aspect_ratio || '16:9',
            duration: params.duration || 5,
            operation: params.operation || 'text_to_video'
        };
        if (params.reference_image_urls) payload.reference_image_urls = params.reference_image_urls;
        return this.submitAndPoll(url, payload, 'SeedanceV2', 900, 3000);
    }

    const payload: any = { ...params };
    delete payload.model;

    return this.submitAndPoll(url, payload, 'Video', 600, 3000);
  }

  private async processI2I(params: any): Promise<StudioGenerationResult> {
    const modelInfo = ModelRegistry.getI2IModelById(params.model) as any;
    const endpoint = modelInfo?.endpoint || params.model;
    const url = `${this.baseUrl}/${endpoint}`;
    
    const imageField = modelInfo?.imageField || 'image_url';
    const payload: any = { ...params };
    delete payload.model;
    if (params.image_url) {
        payload[imageField] = params.image_url;
        delete payload.image_url;
    }

    return this.submitAndPoll(url, payload, 'I2I');
  }

  private async processI2V(params: any): Promise<StudioGenerationResult> {
    const modelInfo = ModelRegistry.getI2VModelById(params.model) as any;
    const endpoint = modelInfo?.endpoint || params.model;
    const url = `${this.baseUrl}/${endpoint}`;
    
    const imageField = modelInfo?.imageField || 'image_url';
    const payload: any = { ...params };
    delete payload.model;
    if (params.image_url) {
        payload[imageField] = params.image_url;
        delete payload.image_url;
    }

    return this.submitAndPoll(url, payload, 'I2V', 600, 3000);
  }

  private async processV2V(params: any): Promise<StudioGenerationResult> {
    const modelInfo = ModelRegistry.getV2VModelById(params.model) as any;
    const endpoint = modelInfo?.endpoint || params.model;
    const url = `${this.baseUrl}/${endpoint}`;
    
    const videoField = modelInfo?.videoField || 'video_url';
    const payload: any = { [videoField]: params.video_url, ...params };
    delete payload.model;
    delete payload.video_url;

    return this.submitAndPoll(url, payload, 'V2V', 600, 3000);
  }

  private async processLipSync(params: any): Promise<StudioGenerationResult> {
    const modelInfo = ModelRegistry.getLipSyncModelById(params.model) as any;
    const endpoint = modelInfo?.endpoint || params.model;
    const url = `${this.baseUrl}/${endpoint}`;
    
    const payload: any = { ...params };
    delete payload.model;

    return this.submitAndPoll(url, payload, 'LipSync', 600, 3000);
  }

  private async submitAndPoll(url: string, payload: any, type: string, maxPoll = 150, interval = 2000): Promise<StudioGenerationResult> {
    const key = this.getApiKey();
    console.log(`[StudioEngine] Submitting ${type} Task to ${url}`);
    
    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`[StudioEngine] API Submit Error: ${await response.text()}`);
    
    const data = await response.json();
    const requestId = data.request_id || data.id;
    
    if (!requestId) {
        const url = data.outputs?.[0] || data.url || data.output?.url;
        return { 
            url, 
            request_id: 'sync', 
            status: 'completed', 
            raw_response: data,
            model: payload.model,
            provider: 'muapi'
        };
    }

    console.log(`[StudioEngine] Task submitted. RequestID: ${requestId}. Polling...`);
    const result = await this.pollForResult(requestId, maxPoll, interval);
    return {
      url: result.outputs?.[0] || result.url || result.output?.url,
      request_id: requestId,
      status: 'completed',
      raw_response: result,
      model: payload.model,
      provider: 'muapi'
    };
  }
}
