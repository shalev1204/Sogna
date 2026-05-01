export interface Scene {
  id: string;
  description: string;
  shot_language?: {
    shot_size?: string;
    camera_movement?: string;
    lighting_key?: string;
  };
  texture_keywords?: string[];
  hero_moment?: boolean;
}

export interface ValidationReport {
  score: number;
  verdict: 'strong' | 'acceptable' | 'revise' | 'fail';
  violations: string[];
  suggestions: string[];
}

export class StructuralValidator {
  private static GENERIC_PHRASES = [
    'a person', 'a beautiful', 'modern', 'futuristic', 'sleek design',
    'innovative', 'dynamic', 'vibrant', 'stunning'
  ];

  static validate(scenes: Scene[]): ValidationReport {
    const violations: string[] = [];
    const suggestions: string[] = [];

    if (scenes.length === 0) {
      return { score: 5, verdict: 'fail', violations: ['No scenes to check'], suggestions: [] };
    }

    // 1. Variety in Shot Sizes
    const shotSizes = scenes.map(s => s.shot_language?.shot_size || 'unspecified');
    const sizeCounts: Record<string, number> = {};
    shotSizes.forEach(s => sizeCounts[s] = (sizeCounts[s] || 0) + 1);

    const mostCommon = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])[0];
    if (scenes.length >= 4 && mostCommon[1] / scenes.length > 0.6) {
      violations.push(`Shot size '${mostCommon[0]}' overuse (${Math.round(mostCommon[1] / scenes.length * 100)}%).`);
      suggestions.push('Mix wide shots with close-ups to create visual rhythm.');
    }

    // 2. Movement Ratio
    const staticCount = scenes.filter(s => !s.shot_language?.camera_movement || s.shot_language.camera_movement === 'static').length;
    if (scenes.length >= 4 && staticCount / scenes.length > 0.7) {
      violations.push(`High static ratio (${Math.round(staticCount / scenes.length * 100)}%).`);
      suggestions.push('Add intentional movement (dolly, pan, tracking) to at least 40% of scenes.');
    }

    // 3. Hero Moment
    if (scenes.length >= 3 && !scenes.some(s => s.hero_moment)) {
      violations.push('No hero moment defined.');
      suggestions.push('Mark the most impactful scene as hero_moment: true.');
    }

    // 4. Lazy Prompting Detection
    let genericCount = 0;
    scenes.forEach(s => {
      const desc = s.description.toLowerCase();
      if (this.GENERIC_PHRASES.some(p => desc.includes(p))) genericCount++;
    });

    if (genericCount / scenes.length > 0.3) {
      violations.push(`Generic language detected in ${genericCount} scenes.`);
      suggestions.push('Replace vague adjectives with specific visual details (e.g., "rain-slicked neon street" instead of "beautiful city").');
    }

    const score = Math.min(5, violations.length * 0.8);
    let verdict: ValidationReport['verdict'] = 'strong';
    if (score >= 4) verdict = 'fail';
    else if (score >= 3) verdict = 'revise';
    else if (score >= 2) verdict = 'acceptable';

    return { score, verdict, violations, suggestions };
  }
}
