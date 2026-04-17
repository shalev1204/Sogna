---
risk: unknown
description: Sognatore objective capability
name: rules

title: Rule Title Here
impact: MEDIUM
impactDescription: Optional description of impact (e.g., "20-50% improvement")
tags: tag1, tag2
version: 1.0.0
---

## Rule Title Here

**Impact: MEDIUM (optional impact description)**

Brief explanation of the rule and why it matters. This should be clear and concise, explaining the performance implications.

**Incorrect (description of what's wrong):**

```typescript
// Bad code example here
const bad = example()
```

**Correct (description of what's right):**

```typescript
// Good code example here
const good = example()
```

Reference: [Link to documentation or resource](https://example.com)

## Sentinel Security Policy
- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
