export interface PipelineStage {
  name: string;
  skill?: string;
  produces: string[];
  required_artifacts_in: string[];
  checkpoint_required: boolean;
  review_focus: string[];
}

export interface ProductionBlueprint {
  name: string;
  category: string;
  description: string;
  stages: PipelineStage[];
}

export class BlueprintRegistry {
  private static blueprints: Record<string, ProductionBlueprint> = {
    cinematic: {
      name: 'Cinematic Narrative',
      category: 'cinematic',
      description: 'High-fidelity cinematic pipeline for trailers and brand films.',
      stages: [
        {
          name: 'research',
          produces: ['research_brief'],
          required_artifacts_in: [],
          checkpoint_required: true,
          review_focus: ['Visual references are relevant', 'Music direction is clear']
        },
        {
          name: 'proposal',
          produces: ['proposal_packet'],
          required_artifacts_in: ['research_brief'],
          checkpoint_required: true,
          review_focus: ['Tone and mood are locked', 'Delivery promise is explicit']
        },
        {
          name: 'scripting',
          produces: ['script'],
          required_artifacts_in: ['proposal_packet'],
          checkpoint_required: true,
          review_focus: ['Pacing is correct', 'Dialogue is sparse']
        },
        {
          name: 'scene_plan',
          produces: ['scene_plan'],
          required_artifacts_in: ['script'],
          checkpoint_required: true,
          review_focus: ['Shot variety (SQA)', 'Camera movement ratio']
        },
        {
          name: 'generation',
          produces: ['asset_manifest'],
          required_artifacts_in: ['scene_plan'],
          checkpoint_required: true,
          review_focus: ['Visual consistency (Playbook)', 'Quality tier enforcement']
        },
        {
          name: 'composition',
          produces: ['render_report'],
          required_artifacts_in: ['asset_manifest', 'scene_plan'],
          checkpoint_required: true,
          review_focus: ['Transitions flow smoothly', 'Audio levels are balanced']
        }
      ]
    },
    social_express: {
      name: 'Social Express',
      category: 'social',
      description: 'Fast-track pipeline for social media clips.',
      stages: [
        {
          name: 'briefing',
          produces: ['project_brief'],
          required_artifacts_in: [],
          checkpoint_required: false,
          review_focus: ['Target platform identified']
        },
        {
          name: 'generation',
          produces: ['raw_video'],
          required_artifacts_in: ['project_brief'],
          checkpoint_required: true,
          review_focus: ['High energy visuals', 'Portrait aspect ratio']
        },
        {
          name: 'reframing',
          produces: ['final_video'],
          required_artifacts_in: ['raw_video'],
          checkpoint_required: false,
          review_focus: ['Subject is centered']
        }
      ]
    },
    hybrid_documentary: {
      name: 'Hybrid Documentary',
      category: 'documentary',
      description: 'Pipeline for productions combining user-supplied footage with generated B-roll.',
      stages: [
        {
          name: 'media_review',
          produces: ['source_review_artifact'],
          required_artifacts_in: [],
          checkpoint_required: true,
          review_focus: ['Usable source files identified', 'Low-quality risks flagged']
        },
        {
          name: 'scripting',
          produces: ['hybrid_script'],
          required_artifacts_in: ['source_review_artifact'],
          checkpoint_required: true,
          review_focus: ['Integration of source dialogue', 'Narration matches visuals']
        },
        {
          name: 'gap_fill_generation',
          produces: ['generated_assets'],
          required_artifacts_in: ['hybrid_script'],
          checkpoint_required: true,
          review_focus: ['Generated clips match source style', 'Visual continuity']
        },
        {
          name: 'composition',
          produces: ['final_master'],
          required_artifacts_in: ['generated_assets', 'source_review_artifact'],
          checkpoint_required: true,
          review_focus: ['Seamless mix of source and gen', 'Color matching']
        }
      ]
    }
  };

  static getBlueprint(name: string): ProductionBlueprint | undefined {
    return this.blueprints[name.toLowerCase()];
  }

  static listBlueprints(): string[] {
    return Object.keys(this.blueprints);
  }
}
