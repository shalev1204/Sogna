export enum PromiseType {
  MOTION_LED = 'motion_led',
  SOURCE_LED = 'source_led',
  DATA_EXPLAINER = 'data_explainer',
  AVATAR_PRESENTER = 'avatar_presenter',
  HYBRID = 'hybrid'
}

export enum QualityTier {
  DRAFT = 'draft',
  PRESENTABLE = 'presentable',
  BROADCAST = 'broadcast'
}

export interface PromiseRules {
  still_fallback_allowed: boolean;
  requires_video_generation: boolean;
  min_motion_ratio: number;
  description: string;
}

export const PROMISE_RULES: Record<string, PromiseRules> = {
  motion_led: {
    still_fallback_allowed: false,
    requires_video_generation: true,
    min_motion_ratio: 0.7,
    description: "Quality depends on real motion — generated video clips or animation."
  },
  avatar_presenter: {
    still_fallback_allowed: false,
    requires_video_generation: true,
    min_motion_ratio: 0.3,
    description: "Requires generated video for the presenter."
  },
  hybrid: {
    still_fallback_allowed: true,
    requires_video_generation: false,
    min_motion_ratio: 0.2,
    description: "Mix of footage, generated content, and graphics."
  }
};

export class DeliveryPromise {
  constructor(
    public type: PromiseType,
    public quality: QualityTier,
    public motionRequired: boolean
  ) {}

  validate(motionRatio: number): { valid: boolean; violations: string[] } {
    const rules = PROMISE_RULES[this.type];
    const violations: string[] = [];

    if (this.motionRequired && motionRatio < rules.min_motion_ratio) {
      violations.push(
        `Motion ratio ${Math.round(motionRatio * 100)}% is below minimum ${rules.min_motion_ratio * 100}% for ${this.type}.`
      );
    }

    if (!rules.still_fallback_allowed && motionRatio < 0.5) {
      violations.push(`${this.type} does not allow still-led fallback. Higher motion generation required.`);
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}
