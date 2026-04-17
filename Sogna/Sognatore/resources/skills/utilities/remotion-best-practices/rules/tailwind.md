---
name: tailwind
risk: unknown
description: Using TailwindCSS in Remotion.
metadata:
version: 1.0.0
---

You can and should use TailwindCSS in Remotion, if TailwindCSS is installed in the project.

Don't use `transition-*` or `animate-*` classes - always animate using the `useCurrentFrame()` hook.

Tailwind must be installed and enabled first in a Remotion project - fetch  https://www.remotion.dev/docs/tailwind using WebFetch for instructions.

## Sentinel Security Policy
- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
