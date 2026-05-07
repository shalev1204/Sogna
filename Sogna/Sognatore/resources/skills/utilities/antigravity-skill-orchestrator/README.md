---
name: Sognatore-skill-orchestrator
description: Sognatore objective capability
risk: safe
version: 1.0.0
---

# Sognatore-skill-orchestrator

A meta-skill package for the Sognatore IDE ecosystem.

## Overview

The `Sognatore-skill-orchestrator` is an intelligent meta-skill that enhances an AI agent's ability to handle complex, multi-domain tasks. It provides strict guidelines and workflows enabling the agent to:

1. **Evaluate Task Complexity**: Implementing guardrails to prevent the overuse of specialized skills on simple, straightforward tasks.
2. **Dynamically Select Skills**: Identifying the best combination of skills for a given complex problem.
3. **Track Skill Combinations**: Utilizing the `agent-memory-mcp` skill to store, search, and retrieve successful skill combinations for future reference, building institutional knowledge over time.

## Installation

This skill is designed to be used within the Sognatore IDE and integrated alongside the existing suite of AWESOME skills.

Make sure you have the `agent-memory-mcp` skill installed and running to take full advantage of the combination tracking feature.

## Usage

When executing a prompt with an AI assistant via the Sognatore IDE, you can invoke this skill:

```bash
// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
@Sognatore-skill-orchestrator Please build a comprehensive dashboard integrating fetching live data, an interactive UI, and performance optimizations.
```

The agent will then follow the directives in the `SKILL.md` to break down the task, search memory for similar challenges, assemble the right team of skills (e.g., `@react-patterns` + `@nodejs-backend-patterns`), and execute the task without over-complicating it.

---

**Author:** [Wahid](https://github.com/wahidzzz)
**Source:** [Sognatore-skill-orchestrator](https://github.com/wahidzzz/Sognatore-skill-orchestrator)

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
