---
trigger: always_on
---

# RULE: CLI - TERMINAL STANDARDS

Guidelines for creating and interacting with CLI tools within the Sognatore ecosystem.

## Core Commands Pattern

Every CLI tool (e.g., `Sognatore.js`) should follow these command patterns:

- `doctor`: For environment diagnostics.
- `plan`: For generating structural implementation plans.
- `run`: For execution.
- `status`: For checking process health.

## UX & UI in Terminal

1. **Beauty**: Use colors (Chalk/Picocolors) for status updates.
2. **Clarity**: Use emojis to represent different status (e.g., ✅ for success, ❌ for error).
3. **Feedback**: Always show progress bars or loading spinners for long-running tasks.

## Security

- Never output sensitive tokens/keys to the console.
- Validate paths before performing write operations.
- Ensure all commands are idempotent when possible.
