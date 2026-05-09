---
name: database-design
risk: safe
description: autonomous capability
version: 1.0.0
---

# Query Optimization

> N+1 problem, EXPLAIN ANALYZE, optimization priorities.

## N+1 Problem

```
What is N+1?
├── 1 query to get parent records
├── N queries to get related records
└── Very slow!

Solutions:
├── JOIN → Single query with all data
├── Eager loading → ORM handles JOIN
├── DataLoader → Batch and cache (GraphQL)
└── Subquery → Fetch related in one query
```

## Query Analysis Mindset

```
Before optimizing:
├── EXPLAIN ANALYZE the query
├── Look for Seq Scan (full table scan)
├── Check actual vs estimated rows
└── Identify missing indexes
```

## Optimization Priorities

1. **Add missing indexes** (most common issue)
2. **Select only needed columns** (not SELECT *)
3. **Use proper JOINs** (avoid subqueries when possible)
4. **Limit early** (pagination at database level)
5. **Cache** (when appropriate)

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
