/**
 * Registro de Skills para el Departamento de Studio
 * El motor creativo y audiovisual de Sognatore.
 */
export const StudioSkillRegistry = {
    VISUAL_SYNTHESIS: [
        'fal-generate',
        'fal-image-edit',
        'fal-upscale',
        'vizcom',
        'generate_image'
    ],
    MOTION_DESIGN: [
        'fal-generate', // Video models
        'remotion',
        'animejs-animation',
        'threejs-animation',
        'magic-animator'
    ],
    ACOUSTICS: [
        'fal-audio',
        'audio-transcriber',
        'podcast-generation'
    ],
    CREATIVE_FLOW: [
        'design-spells',
        'design-md',
        'canvas-design',
        'style-seed-toss'
    ],
    POST_PRODUCTION: [
        'videodb-skills',
        'slack-gif-creator',
        'favicon'
    ]
};

export type StudioSkillCategory = keyof typeof StudioSkillRegistry;
