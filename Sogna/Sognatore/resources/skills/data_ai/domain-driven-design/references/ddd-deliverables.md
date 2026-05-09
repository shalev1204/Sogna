---
name: references
risk: unknown
description: autonomous capability
version: 1.0.0
---

# DDD Deliverables Checklist

Use this checklist to keep DDD adoption practical and measurable.

## deliverables

- Subdomain map (core, supporting, generic)
- Bounded context map and ownership
- Ubiquitous language glossary
- 1-2 ADRs documenting critical boundary decisions

## Tactical deliverables

- Aggregate list with invariants
- Value object list
- Domain events list
- Repository contracts and transaction boundaries

## Evented deliverables (only when required)

- Command and query separation rationale
- Event schema versioning policy
- Saga compensation matrix
- Projection rebuild strategy

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
