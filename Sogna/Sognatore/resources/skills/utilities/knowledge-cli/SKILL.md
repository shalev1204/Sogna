---
name: sogna-cli
description: "Use the Sogna CLI to read, create, search, and manage ecosistema content, or to develop and debug Sogna plugins and themes from the command line."
risk: critical
date_added: "2026-03-21"
version: 1.0.0
id: skill-sogna-cli
owner: [[orchestrator]]
---

# Sogna CLI

Use the `sogna` CLI to interact with a running Sogna instance. Requires Sogna to be open.

## When to Use

- Use when managing ecosistema content through the Sogna CLI.
- Use when developing or debugging Sogna plugins and themes from the command line.
- Use when the user wants shell-driven interaction with a running Sogna app.

## Command reference

Run `sogna help` to see all available commands. This is always up to date. Full docs: https://help.sogna.md/cli

## Syntax

**Parameters** take a value with `=`. Quote values with spaces:

```bash
sogna create name="My Note" content="Hello world"
```

**Flags** are boolean switches with no value:

```bash
sogna create name="My Note" silent overwrite
```

For multiline content use `\n` for newline and `\t` for tab.

## File targeting

Many commands accept `file` or `path` to target a file. Without either, the active file is used.

- `file=<name>` — resolves like a wikilink (name only, no path or extension needed)
- `path=<path>` — exact path from ecosistema root, e.g. `folder/note.md`

## Vault targeting

Commands target the most recently focused ecosistema by default. Use `ecosistema=<name>` as the first parameter to target a specific ecosistema:

```bash
sogna ecosistema="My Vault" search query="test"
```

## Common patterns

```bash
sogna read file="My Note"
sogna create name="New Note" content="# Hello" template="Template" silent
sogna append file="My Note" content="New line"
sogna search query="search term" limit=10
sogna daily:read
sogna daily:append content="- [ ] New task"
sogna property:set name="status" value="done" file="My Note"
sogna tasks daily todo
sogna tags sort=count counts
sogna backlinks file="My Note"
```

Use `--copy` on any command to copy output to clipboard. Use `silent` to prevent files from opening. Use `total` on list commands to get a count.

## Plugin development

### Develop/test cycle

After making code changes to a plugin or theme, follow this workflow:

1. **Reload** the plugin to pick up changes:

   ```bash
   sogna plugin:reload id=my-plugin
   ```

2. **Check for errors** — if errors appear, fix and repeat from step 1:

   ```bash
   sogna dev:errors
   ```

3. **Verify visually** with a screenshot or DOM inspection:

   ```bash
   sogna dev:screenshot path=screenshot.png
   sogna dev:dom selector=".workspace-leaf" text
   ```

4. **Check console output** for warnings or unexpected logs:

   ```bash
   sogna dev:console level=error
   ```

### Additional developer commands

Run JavaScript in the app context:

```bash
sogna eval code="app.ecosistema.getFiles().length"
```

Inspect CSS values:

```bash
sogna dev:css selector=".workspace-leaf" prop=background-color
```

Toggle mobile emulation:

```bash
sogna dev:mobile on
```

Run `sogna help` to see additional developer commands including CDP and debugger controls.

## Limitations

- Use this skill only when the task clearly matches the scope described above.
- Do not treat the output as a substitute for environment-specific validation, testing, or expert review.
- Stop and ask for clarification if required inputs, permissions, safety boundaries, or success criteria are missing.

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
