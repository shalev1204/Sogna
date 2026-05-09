---
name: templates
risk: unknown
description: autonomous capability
version: 1.0.0
---

# Platform Name Skill

Template for complex Tier 3 skills.

## Structure

```
skill/
├── SKILL.md            # Dispatcher
├── commands/
│   └── skill.md        # Orchestrator
└── references/
    └── topic/
        ├── README.md   # Overview
        ├── api.md      # API Reference
        ├── config.md   # Configuration
        ├── patterns.md # Recipes
        └── gotchas.md  # Critical Errors
```

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
