---
name: screenshots
description: Sognatore objective capability
risk: critical
version: 1.0.0
---

# Dashboard Screenshots

This directory contains screenshots for the Sognatore README.

---

## Required Screenshots

### 1. `dashboard-agents.png`

**What to capture:** The agent monitoring section of the Sognatore dashboard showing active agents.

**How to create:**
1. Run Sognatore with a test project:
   ```bash
   cd /path/to/test/project
   ../../autonomy/run.sh examples/simple-todo-app.md
   ```

2. Open the dashboard:
   ```bash
   open .sognatore/dashboard/index.html
   ```

3. Wait for agents to spawn (should happen within 30-60 seconds)

4. Take a screenshot of the **"Active Agents" section** showing:
   - Multiple agent cards (ideally 5-8 visible)
   - Agent IDs and types (e.g., "eng-frontend", "qa-001-testing")
   - Model badges (Sonnet, Haiku, Opus) with color coding
   - Current work being performed
   - Runtime and tasks completed stats
   - Status indicators (active/completed)

**Recommended size:** 1200px wide (use browser zoom to fit multiple agents)

**Save as:** `dashboard-agents.png`

---

### 2. `dashboard-tasks.png`

**What to capture:** The task queue kanban board section.

**How to create:**
1. Using the same running Sognatore instance from above

2. Scroll down to the **"Task Queue" section**

3. Take a screenshot showing all four columns:
   - **Pending** (left column, ideally with 3-5 tasks)
   - **In Progress** (should have at least 1 task)
   - **Completed** (should show several completed tasks)
   - **Failed** (can be empty, that's fine)

4. Ensure the screenshot shows:
   - Column headers with count badges
   - Task cards with IDs, types, and descriptions
   - Clear separation between columns

**Recommended size:** 1200px wide

**Save as:** `dashboard-tasks.png`

---

## Screenshot Specifications

- **Format:** PNG (for quality and transparency support)
- **Resolution:** At least 1200px wide, retina/2x if possible
- **Browser:** Use Chrome or Firefox for consistent rendering
- **Zoom:** Adjust browser zoom to fit content nicely (90-100%)
- **Clean State:** Ensure no browser extensions visible, clean URL bar

---

## Testing the Screenshots

After adding screenshots, verify they display correctly in the README:

```bash
# View the README with screenshots
open README.md
# or use a Markdown viewer
```

Check that:
- [ ] Images load without errors
- [ ] Resolution is clear and readable
- [ ] Colors match the Sognatore design (cream background, coral accents)
- [ ] Text in screenshots is legible

---

## Placeholder Images

If you don't have live agent data yet, you can use the test data provided in this repository:

```bash
# Create test agent data
cd /Users/lokesh/git/jobman  # or any test project
mkdir -p .agent/sub-agents .sognatore/state .sognatore/queue

# Copy test data from Sognatore repo
cp ~/git/sognatore/tests/fixtures/agents/*.json .agent/sub-agents/
cp ~/git/sognatore/tests/fixtures/queue/*.json .sognatore/queue/

# Generate dashboard
~/git/sognatore/autonomy/run.sh --generate-dashboard-only

# Open dashboard
open .sognatore/dashboard/index.html
```

---

## Current Status

- [ ] `dashboard-agents.png` - Not yet created
- [ ] `dashboard-tasks.png` - Not yet created

Once screenshots are added, update this checklist and commit:

```bash
git add docs/screenshots/*.png
git commit -m "Add dashboard screenshots for README"
```

---

## Alternative: Create Mock Screenshots

If you want to create mock/placeholder screenshots quickly:

1. Use the test fixture data (see above)
2. Edit `.sognatore/state/agents.json` to add more agents
3. Edit `.sognatore/queue/*.json` to populate task columns
4. Refresh dashboard and capture screenshots

This gives you polished screenshots without waiting for a full Sognatore run.

---

**Note:** Screenshots should demonstrate Sognatore's capabilities while being clean and professional. Avoid showing:
- Personal information or API keys
- Error states (unless specifically demonstrating error handling)
- Cluttered or confusing data

The goal is to show potential users what the dashboard looks like during normal operation.

## Sentinel Security Policy
- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.
