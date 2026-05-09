# Sentinel Security 🛡️

Sentinel is the security management component of the Sogna monorepo. It operates as a technical defense system, maintaining the project's integrity, data safety, and operational logic.

## 🏗️ Layered Security Architecture

The security of Sogna is distributed across four distinct planes:

### 1. Execution Plane (Active Defense)

Intervenes during the development lifecycle to prevent security violations.

- **Hook**: `bin/sentinel-veto.js` (The System Veto Hook).
- **Core Capabilities**:
  - **DLP (Data Loss Prevention)**: Scans for secrets, keys, and unauthorized patterns.
  - **AST Shielding**: Analyzes syntax trees to detect logic vulnerabilities.
  - **BashShield**: Heuristic verification of shell commands.

### 2. Intelligence Plane (Security Definitions)

The knowledge base containing threat patterns and signatures.

- **Data Repository**: `data/`
- **Assets**:
  - `signatures.json`: Database of institutional file signatures.
  - `security.json`: Centralized policies, whitelists, and rules.
  - `honeypots.json`: Registry of decoy files used for intrusion detection.

### 3. Historical Plane (Audit Logs)

Persistence of historical threat data and hardening state.

- **Global Memory**: `memory/security/` (Shared across the monorepo).
- **Traceability**:
  - `blacklist.json`: SHA-256 hashes of neutralized artifacts.
  - `INCIDENT_LOG.md`: Audit trail of security events.

### 4. Compliance Plane (Integrity)

System monitoring and operational regulation.

- **Predatore**: `Sognatore/src/audit/`
- **Logic**: Verifies system state against the behavioral protocols and manages data residency.

---

## 📂 Directory Structure

| Directory | Purpose |
| :--- | :--- |
| `bin/` | Executable hooks and core engine logic. |
| `data/` | Tactical intelligence (signatures, policies, whitelists). |
| `reports/` | Security intelligence reports and history. |
| `src/` | Supporting modules and security utilities. |
| `apps/` | Internal security applications and tools. |

---

## 📜 Directives

1. **Veto Authority**: Immediately stop any process exhibiting malicious syntax or pattern violations.
2. **Data Integrity**: Automated removal of forbidden files (keys, secrets, unverified `.env`).
3. **Pattern Learning**: Threats are distilled into signatures or learned patterns for future detection.
4. **Decoy Monitoring**: Any modification to honeypot files triggers a security protocol.

---

## 🕹️ CLI Usage

Standard commands managed via the Sogna toolkit:

| Command | Action |
| :--- | :--- |
| `pnpm sentinel:sweep` | Performs a global audit of the entire monorepo. |
| `node bin/sentinel-veto.js [file]` | Audits specific files. |
| `node bin/sentinel-veto.js --fix` | Automatically remediates certain formatting and header issues. |

---

*The reliability of the Sogna Ecosystem depends on the integrity of its security protocols.*
