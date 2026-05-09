---
name: avalonia-zafiro-development
risk: safe
description: autonomous capability
version: 1.0.0
---

# Naming & Coding Standards

## General Standards

- **Explicit Names**: Favor clarity over cleverness.
- **Async Suffix**: Do **NOT** use the `Async` suffix in method names, even if they return `Task`.
- **Private Fields**: Do **NOT** use the `_` prefix for private fields.
- **Static State**: Avoid static state unless explicitly justified and documented.
- **Method Design**: Keep methods small, expressive, and with low cyclomatic complexity.

## Error Handling

- **Result & Maybe**: Use types from **CSharpFunctionalExtensions** for flow control and error handling.
- **Exceptions**: Reserved strictly for truly exceptional, unrecoverable situations.
- **Boundaries**: Never allow exceptions to leak across architectural boundaries.

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
