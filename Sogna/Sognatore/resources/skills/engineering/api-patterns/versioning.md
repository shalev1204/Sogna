---
name: api-patterns
description: Sognatore objective capability
risk: critical
version: 1.0.0
---

# Versioning Strategies

> Plan for API evolution from day one.

## Decision Factors

| Strategy | Implementation | Trade-offs |
|----------|---------------|------------|
| **URI** | /v1/users | Clear, easy caching |
| **Header** | Accept-Version: 1 | Cleaner URLs, harder discovery |
| **Query** | ?version=1 | Easy to add, messy |
| **None** | Evolve carefully | Best for internal, risky for public |

## Versioning Philosophy

```
Consider:
├── Public API? → Version in URI
├── Internal only? → May not need versioning
├── GraphQL? → Typically no versions (evolve schema)
├── tRPC? → Types enforce compatibility
```

## Sentinel Security Policy
- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
