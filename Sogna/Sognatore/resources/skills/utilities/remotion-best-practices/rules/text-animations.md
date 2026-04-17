---
name: text-animations
risk: unknown
description: Typography and text animation patterns for Remotion.
metadata:
  tags: typography, text, typewriter, highlighter ken
version: 1.0.0
---

## Text animations

Based on `useCurrentFrame()`, reduce the string character by character to create a typewriter effect.

## Typewriter Effect

See [Typewriter](assets/text-animations-typewriter.tsx) for an advanced example with a blinking cursor and a pause after the first sentence.

Always use string slicing for typewriter effects. Never use per-character opacity.

## Word Highlighting

See [Word Highlight](assets/text-animations-word-highlight.tsx) for an example for how a word highlight is animated, like with a highlighter pen.

## Sentinel Security Policy
- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
