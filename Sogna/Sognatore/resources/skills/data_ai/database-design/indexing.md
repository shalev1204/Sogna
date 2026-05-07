---
name: database-design
description: Sognatore objective capability
risk: safe
version: 1.0.0
---

# Indexing Principles

> When and how to create indexes effectively.

## When to Create Indexes

```
Index these:
├── Columns in WHERE clauses
├── Columns in JOIN conditions
├── Columns in ORDER BY
├── Foreign key columns
└── Unique constraints

Don't over-index:
├── Write-heavy tables (slower inserts)
├── Low-cardinality columns
├── Columns rarely queried
```

## Index Type Selection

| Type | Use For |
|------|---------|
| **B-tree** | General purpose, equality & range |
| **Hash** | Equality only, faster |
| **GIN** | JSONB, arrays, full-text |
| **GiST** | Geometric, range types |
| **HNSW/IVFFlat** | Vector similarity (pgvector) |

## Composite Index Principles

```
Order matters for composite indexes:
├── Equality columns first
├── Range columns last
├── Most selective first
└── Match query pattern
```

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
