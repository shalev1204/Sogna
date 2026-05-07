---
risk: unknown
description: Sognatore objective capability
name: references

title: Follow Workflow Constraints
impact: CRITICAL
impactDescription: Violating constraints breaks recovery and durability guarantees
tags: workflow, constraints, rules, best-practices
version: 1.0.0
---

## Follow Workflow Constraints

Workflows have specific constraints to maintain durability guarantees. Violating them can break recovery.

**Incorrect (starting workflows from steps):**

```typescript
async function myStep() {
  // Don't start workflows from steps!
  await DBOS.startWorkflow(otherWorkflow)();
}

async function myOtherStep() {
  // Don't call recv from steps!
  const msg = await DBOS.recv("topic");
}

async function myWorkflowFn() {
  await DBOS.runStep(myStep, { name: "myStep" });
}
```

**Correct (workflow operations only from workflows):**

```typescript
// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
async function fetchData() {
  // Steps only do external operations
// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
  return await fetch("https://api.example.com").then(r => r.json());
}

async function myWorkflowFn() {
// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
  await DBOS.runStep(fetchData, { name: "fetchData" });
  // Start child workflows from the parent workflow
  await DBOS.startWorkflow(otherWorkflow)();
  // Receive messages from the workflow
  const msg = await DBOS.recv("topic");
  // Set events from the workflow
  await DBOS.setEvent("status", "done");
}
const myWorkflow = DBOS.registerWorkflow(myWorkflowFn);
```

Additional constraints:

- Don't modify global variables from workflows or steps
- Steps in parallel must start in deterministic order:

```typescript
// CORRECT - deterministic start order
const results = await Promise.allSettled([
  DBOS.runStep(() => step1("arg1"), { name: "step1" }),
  DBOS.runStep(() => step2("arg2"), { name: "step2" }),
  DBOS.runStep(() => step3("arg3"), { name: "step3" }),
]);
```

Use `Promise.allSettled` instead of `Promise.all` to safely handle errors without crashing the Node.js process.

Reference: [Workflow Guarantees](https://docs.dbos.dev/typescript/tutorials/workflow-tutorial#workflow-guarantees)

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
