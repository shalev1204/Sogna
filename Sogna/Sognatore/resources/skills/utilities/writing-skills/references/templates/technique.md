---
name: technique-name
risk: unknown
description: Use when [specific symptom].
metadata:
  category: technique
  triggers: error-text, symptom, tool-name
version: 1.0.0
---

# Technique Name

## Overview

[1-2 sentence core principle]

## When to Use

- [Symptom A]
- [Symptom B]
- [Error message text]

**NOT for:**

- [When to avoid]

## The Problem

```javascript
// Bad example
function badCode() {
  // problematic pattern
}
```

## The Solution

```javascript
// Good example
function goodCode() {
  // improved pattern
}
```

## Step-by-Step

1. [First step]
2. [Second step]
3. [Final step]

## Quick Reference

| Scenario | Approach |
|----------|----------|
| Case A | Solution A |
| Case B | Solution B |

## Common Mistakes

**Mistake 1:** [Description]

- Wrong: `bad code`
- Right: `good code`

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
