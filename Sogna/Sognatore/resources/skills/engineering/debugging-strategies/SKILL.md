---
name: debugging-strategies
description: "Transform debugging from frustrating guesswork into systematic problem-solving with proven strategies, powerful tools, and methodical approaches."
risk: safe
date_added: "2026-02-27"
version: 1.0.0
id: skill-debugging-strategies
owner: [[debugger]]
---

# Debugging Strategies

Transform debugging from frustrating guesswork into systematic problem-solving with proven strategies, powerful tools, and methodical approaches.

## Use this skill when

- Tracking down elusive bugs
- Investigating performance issues
- Debugging production incidents
- Analyzing crash dumps or stack traces
- Debugging distributed systems

## Do not use this skill when

- There is no reproducible issue or observable symptom
- The task is purely feature development
- You cannot access logs, traces, or runtime signals

## Instructions

- Reproduce the issue and capture logs, traces, and environment details.
- Form hypotheses and design controlled experiments.
- Narrow scope with binary search and targeted instrumentation.
- Document findings and verify the fix.
- If detailed playbooks are required, open `resources/implementation-playbook.md`.

## Resources

- `resources/implementation-playbook.md` for detailed debugging patterns and checklists.

## Limitations

- Use this skill only when the task clearly matches the scope described above.
- Do not treat the output as a substitute for environment-specific validation, testing, or expert review.
- Stop and ask for clarification if required inputs, permissions, safety boundaries, or success criteria are missing.

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
