# Sentinel Security Ecosystem: Sovereign Defense HQ 🛡️

Sentinel is the central security headquarters (HQ) of the Sogna monorepo. It operates as an agentic defense system, maintaining eternal vigilance over the project's integrity, data safety, and behavioral logic.

## 🏰 Layered Defense Architecture

The security of Sogna is distributed across four distinct planes of operation, all coordinated from this HQ:

### 1. Execution Plane (Active Defense)
The primary line of defense that intervenes during the development lifecycle.
- **Hook**: `bin/sentinel-veto.js` (The System Veto Hook).
- **Core Capabilities**:
  - **DLP (Data Loss Prevention)**: Scans for secrets, keys, and forbidden patterns.
  - **AST Shielding**: Analyzes syntax trees to detect logic bombs and prototype pollution.
  - **BashShield**: Heuristic verification of shell commands.

### 2. Intelligence Plane (Risk DNA)
The knowledge base that fuels the engines with threat patterns and signatures.
- **Data Repository**: `data/`
- **Assets**:
  - `signatures.json`: 1.8MB database of institutional file signatures.
  - `soberania.json`: Centralized policy, whitelists, and authoritative rules.
  - `honeypots.json`: Registry of decoy files used to entrap unauthorized actors.

### 3. Immunological Plane (Memory Persistence)
Historical awareness of threats and system hardening state.
- **Global Memory**: `memory/security/` (Shared across the monorepo).
- **Traceability**:
  - `blacklist.json`: SHA-256 hashes of neutralized artifacts.
  - `INCIDENT_LOG.md`: Forensic audit trail of security events.

### 4. Compliance Plane (Core Integrity)
Internal system monitoring and operational regulation.
- **Auditor**: `Sognatore/src/audit/`
- **Logic**: Verifies system state against the Sovereign Rules and manages data residency.

---

## 📂 Distribution & Organization

| Directory | Purpose |
| :--- | :--- |
| `bin/` | Executable hooks and core engine logic. |
| `data/` | Tactical intelligence (signatures, policies, whitelists). |
| `reports/` | Detailed security intelligence reports (`THREAD_INTEL.md`). |
| `src/` | Supporting modules and security utilities. |
| `apps/` | Internal security applications and guard tools. |

---

## 📜 Primary Directives (System Security)

1. **Veto Authority**: Stop any process exhibiting "Prompt Hijacking" or malicious syntax immediately.
2. **Zero-Persistence**: Radical purging of forbidden files (keys, secrets, unverified `.env`).
3. **Institutional Memory**: Every threat found must be distilled into a signature or learned pattern.
4. **Honeypot Integrity**: Monitor decoy files. Any modification triggers a panic protocol.

---

## 🕹️ CLI Usage

Standard commands orchestrated via the Sogna toolkit:

| Command | Action |
| :--- | :--- |
| `pnpm sentinel:sweep` | Performs a global audit of the entire monorepo. |
| `node bin/sentinel-veto.js [file]` | Audits specific files (Standard pre-commit hook). |
| `node bin/sentinel-veto.js --fix` | Automatically remediates delays and missing headers. |

---

> *"I do not just audit; I learn. I do not just detect; I protect. The autonomy of Sognatore depends on the integrity of its headquarters."*
