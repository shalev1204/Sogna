import fs from 'fs';
import path from 'path';

export interface Playbook {
  identity: {
    name: string;
    category: string;
    mood: string;
    pace: string;
    best_for: string;
  };
  visual_language: {
    color_palette: {
      primary: string[];
      accent: string[];
      background: string;
      text: string;
      surface: string;
      muted: string;
    };
    composition: string;
    texture: string;
    shorthand: string;
  };
  typography: {
    headings: { font: string; weight: number };
    body: { font: string; weight: number };
  };
  motion: {
    transitions: string[];
    animation_style: string;
    pacing_rules: {
      min_scene_hold_seconds: number;
      max_scene_hold_seconds: number;
      transition_duration_seconds: number;
    };
  };
  asset_generation: {
    image_prompt_prefix: string;
    consistency_anchors: string[];
  };
}

export class PlaybookManager {
  private static presets: Record<string, Playbook> = {
    cinematic: {
      identity: {
        name: 'Cinematic High-Fidelity',
        category: 'cinematic',
        mood: 'dramatic',
        pace: 'moderate',
        best_for: 'Narrative storytelling and high-end commercials'
      },
      visual_language: {
        color_palette: {
          primary: ['#0F172A'],
          accent: ['#F59E0B'],
          background: '#020617',
          text: '#F8FAFC',
          surface: '#0F172A',
          muted: '#64748B'
        },
        composition: 'Anamorphic, wide-angle, rule of thirds',
        texture: 'Fine film grain, soft highlights',
        shorthand: 'cinematic lighting, 35mm film, anamorphic'
      },
      typography: {
        headings: { font: 'Inter', weight: 800 },
        body: { font: 'Inter', weight: 400 }
      },
      motion: {
        transitions: ['crossfade', 'dissolve'],
        animation_style: 'Smooth, physics-based',
        pacing_rules: {
          min_scene_hold_seconds: 3.0,
          max_scene_hold_seconds: 8.0,
          transition_duration_seconds: 1.0
        }
      },
      asset_generation: {
        image_prompt_prefix: 'cinematic, 35mm film, dramatic lighting, highly detailed',
        consistency_anchors: ['low-key lighting', 'muted tones']
      }
    },
    modern: {
      identity: {
        name: 'Modern Tech',
        category: 'minimalist',
        mood: 'clean',
        pace: 'fast',
        best_for: 'Product demos and software explainers'
      },
      visual_language: {
        color_palette: {
          primary: ['#3B82F6'],
          accent: ['#10B981'],
          background: '#FFFFFF',
          text: '#1F2937',
          surface: '#F3F4F6',
          muted: '#6B7280'
        },
        composition: 'Balanced, centered, geometric',
        texture: 'Clean, flat colors, sharp edges',
        shorthand: 'modern minimalist, clean lines, flat design'
      },
      typography: {
        headings: { font: 'Outfit', weight: 700 },
        body: { font: 'Outfit', weight: 400 }
      },
      motion: {
        transitions: ['slide', 'cut'],
        animation_style: 'Snappy, spring-based',
        pacing_rules: {
          min_scene_hold_seconds: 1.5,
          max_scene_hold_seconds: 4.0,
          transition_duration_seconds: 0.3
        }
      },
      asset_generation: {
        image_prompt_prefix: 'modern minimalist, clean lines, bright lighting, high quality',
        consistency_anchors: ['flat design', 'vibrant accents']
      }
    }
  };

  static getPlaybook(name: string): Playbook | undefined {
    return this.presets[name.toLowerCase()];
  }

  /**
   * Generates a schema-valid playbook from high-level mood and tone.
   */
  static generateFromBrief(name: string, context: { mood: string; tone: string; pace?: string }): Playbook {
    const mood = context.mood.toLowerCase();
    const tone = context.tone.toLowerCase();
    
    // 1. Color Logic
    let colors = {
        primary: ['#3B82F6'], accent: ['#F59E0B'], background: '#FFFFFF', text: '#1F2937',
        surface: '#F3F4F6', muted: '#6B7280'
    };

    if (['dark', 'noir', 'neon', 'cyberpunk'].includes(mood)) {
        colors = { 
            primary: ['#8B5CF6'], accent: ['#EC4899'], background: '#020617', text: '#F8FAFC',
            surface: '#0F172A', muted: '#64748B'
        };
    } else if (['organic', 'warm', 'nature'].includes(mood)) {
        colors = { 
            primary: ['#059669'], accent: ['#D97706'], background: '#FEFCE8', text: '#1C1917',
            surface: '#FFFBEB', muted: '#78350F'
        };
    }

    // 2. Visual SQA Anchors
    const toneToShorthand: Record<string, string> = {
        cinematic: 'cinematic lighting, 35mm film, anamorphic, highly detailed',
        minimalist: 'flat design, clean lines, minimalist, vector style',
        corporate: 'professional lighting, clean corporate environment, high-end',
        raw: 'handheld camera, raw footage, documentary style, natural lighting'
    };

    const playbook: Playbook = {
      identity: {
        name,
        category: tone === 'cinematic' ? 'cinematic' : 'motion-graphics',
        mood,
        pace: context.pace || 'moderate',
        best_for: `Custom ${mood} ${tone} production`
      },
      visual_language: {
        color_palette: colors,
        composition: tone === 'cinematic' ? 'anamorphic, wide' : 'centered, geometric',
        texture: mood === 'noir' ? 'film grain' : 'clean digital',
        shorthand: toneToShorthand[tone] || 'high quality'
      },
      typography: {
        headings: { font: 'Inter', weight: 800 },
        body: { font: 'Inter', weight: 400 }
      },
      motion: {
        transitions: ['crossfade', 'cut'],
        animation_style: 'smooth',
        pacing_rules: {
          min_scene_hold_seconds: 2.0,
          max_scene_hold_seconds: 6.0,
          transition_duration_seconds: 0.5
        }
      },
      asset_generation: {
        image_prompt_prefix: `${mood} ${tone} style, ${toneToShorthand[tone] || ''}`,
        consistency_anchors: [`${mood} atmosphere`, `${tone} visual language`, `palette: ${colors.primary[0]}`]
      }
    };

    return playbook;
  }

  /**
   * Generates a DESIGN.md representation of the playbook.
   */
  static generateDesignDoc(playbook: Playbook): string {
    return `# DESIGN — ${playbook.identity.name}
    
> Generated by Sogna Studio Playbook Intelligence.

## 🎨 Visual Identity
- **Mood**: ${playbook.identity.mood}
- **Tone/Category**: ${playbook.identity.category}
- **Composition**: ${playbook.visual_language.composition}

## 🌈 Color Palette
- **Primary**: \`${playbook.visual_language.color_palette.primary[0]}\`
- **Accent**: \`${playbook.visual_language.color_palette.accent[0]}\`
- **Background**: \`${playbook.visual_language.color_palette.background}\`
- **Text**: \`${playbook.visual_language.color_palette.text}\`

## 🔠 Typography
- **Headings**: ${playbook.typography.headings.font} (${playbook.typography.headings.weight})
- **Body**: ${playbook.typography.body.font} (${playbook.typography.body.weight})

## 🎬 Motion & Pacing
- **Transitions**: ${playbook.motion.transitions.join(', ')}
- **Style**: ${playbook.motion.animation_style}
- **Min Hold**: ${playbook.motion.pacing_rules.min_scene_hold_seconds}s

## 🤖 AI Consistency Anchors
- **Shorthand**: \`${playbook.visual_language.shorthand}\`
- **Anchors**: ${playbook.asset_generation.consistency_anchors.map(a => `\`${a}\``).join(', ')}
`;
  }
}
