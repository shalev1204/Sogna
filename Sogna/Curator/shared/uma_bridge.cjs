const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

/**
 * UMA Universal Bridge
 * Provides a standardized API for toolkit engines to interact with Sogna Memory.
 */
class UmaBridge {
  constructor() {
    this.root = path.resolve(process.cwd(), 'memory');
    this.registryPath = path.join(this.root, 'registry.json');
    this.securityDir = path.join(this.root, 'security');
    this.incidentLog = path.join(this.securityDir, 'incident_log.md');
    this.blacklistPath = path.join(this.securityDir, 'blacklist.json');
  }

  /**
   * Reports a security incident and automatically blacklists the secret hash.
   */
  async logIncident(type, source, secretContent = null) {
    const timestamp = new Date().toISOString();
    
    // 1. Log to INCIDENT_LOG.md (Metadata only)
    const logEntry = `| ${timestamp} | ${type} | ${source} | Neutralized |\n`;
    if (!await fs.pathExists(this.incidentLog)) {
      await fs.outputFile(this.incidentLog, '# Sogna Security Incidents\n\n| Timestamp | Type | Source | Status |\n|---|---|---|---|\n');
    }
    await fs.appendFile(this.incidentLog, logEntry);

    // 2. Add to Hash Blacklist if content provided
    if (secretContent) {
      const hash = crypto.createHash('sha256').update(secretContent).digest('hex');
      let blacklist = [];
      if (await fs.pathExists(this.blacklistPath)) {
        blacklist = await fs.readJson(this.blacklistPath);
      }
      if (!blacklist.includes(hash)) {
        blacklist.push(hash);
        await fs.outputJson(this.blacklistPath, blacklist, { spaces: 2 });
      }
    }
  }

  /**
   * Standardized discovery reporting for toolkit engines.
   */
  async reportDiscovery(file, description) {
    const registry = await fs.readJson(this.registryPath);
    // Logic to ensure registry is aware of new files if needed
    console.log(`[UMA] Discovery reported: ${file} - ${description}`);
  }
}

module.exports = new UmaBridge();
