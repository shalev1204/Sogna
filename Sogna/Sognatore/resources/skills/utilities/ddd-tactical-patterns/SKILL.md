---
name: ddd-tactical-patterns
description: "Apply DDD tactical patterns in code using entities, value objects, aggregates, repositories, and domain events with explicit invariants."
risk: safe
tags: "[ddd, tactical, aggregates, value-objects, domain-events]"
date_added: "2026-02-27"
version: 1.0.0
id: skill-ddd-tactical-patterns
owner: [[orchestrator]]
---


# DDD Tactical Patterns

## Use this skill when

- Translating domain rules into code structures.
- Designing aggregate boundaries and invariants.
- Refactoring an anemic model into behavior-rich domain objects.
- Defining repository contracts and domain event boundaries.

## Do not use this skill when

- You are still defining strategic boundaries.
- The task is only API documentation or UI layout.
- Full DDD complexity is not justified.

## Instructions

1. Identify invariants first and design aggregates around them.
2. Model immutable value objects for validated concepts.
3. Keep domain behavior in domain objects, not controllers.
4. Emit domain events for meaningful state transitions.
5. Keep repositories at aggregate root boundaries.

If detailed checklists are needed, open `references/tactical-checklist.md`.

## Example

```typescript
class Order {
  private status: "draft" | "submitted" = "draft";

  submit(itemsCount: number): void {
    if (itemsCount === 0) throw new Error("Order cannot be submitted empty");
    if (this.status !== "draft") throw new Error("Order already submitted");
    this.status = "submitted";
  }
}
```

## Limitations

- This skill does not define deployment architecture.
- It does not choose databases or transport protocols.
- It should be paired with testing patterns for invariant coverage.

## Sentinel Security Policy
- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
