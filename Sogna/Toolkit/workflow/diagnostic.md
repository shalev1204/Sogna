# WORKFLOW: DIAGNOSTIC - ENVIRONMENT HEALTH

Standard procedure for verifying system stability.

## Trigger
Use this workflow at the start of a session or after major configuration changes.

## Steps

1.  **DOCTOR**: Run local diagnostic tools (e.g., `loki doctor`).
2.  **DEPS**: Check for missing dependencies or outdated versions.
3.  **CONFIG**: Verify `.env` and configuration files are valid.
4.  **LOGS**: Check system logs for silent errors.
5.  **REPORT**: Summarize findings and propose fixes if needed.

## Key Indicators
- [ ] Green: All systems functional.
- [ ] Yellow: Configuration warnings (lint, minor deps).
- [ ] Red: Breaking issues (missing keys, core failures).
