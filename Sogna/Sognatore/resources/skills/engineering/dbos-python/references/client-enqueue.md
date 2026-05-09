---
risk: unknown
description: Sognatore objective capability
name: references

title: Enqueue Workflows from External Applications
impact: HIGH
impactDescription: Enables decoupled architecture with separate API and worker services
tags: client, enqueue, workflow, external
version: 1.0.0
---

## Enqueue Workflows from External Applications

Use `client.enqueue()` to submit workflows from outside the DBOS application. Must specify workflow and queue names explicitly.

**Incorrect (missing required options):**

```python
from dbos import DBOSClient

client = DBOSClient(system_database_url=db_url)

# Missing workflow_name and queue_name!

handle = client.enqueue({}, task_data)
```

**Correct (with required options):**

```python
from dbos import DBOSClient, EnqueueOptions

client = DBOSClient(system_database_url=db_url)

options: EnqueueOptions = {
"workflow_name": "process_task", # Required
"queue_name": "task_queue", # Required
}
handle = client.enqueue(options, task_data)
result = handle.get_result()
client.destroy()
```

With optional parameters:

```python
options: EnqueueOptions = {
"workflow_name": "process_task",
"queue_name": "task_queue",
    "workflow_id": "custom-id-123",
    "workflow_timeout": 300,
    "deduplication_id": "user-123",
    "priority": 1,
}
```

Limitation: Cannot enqueue workflows that are methods on Python classes.

Reference: [DBOSClient.enqueue](https://docs.dbos.dev/python/reference/client#enqueue)

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
