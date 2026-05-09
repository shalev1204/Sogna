const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * UMA Bridge
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
    
    if (!fs.existsSync(this.securityDir)) {
      fs.mkdirSync(this.securityDir, { recursive: true });
    }

    if (!fs.existsSync(this.incidentLog)) {
      fs.writeFileSync(this.incidentLog, '# Sogna Security Incidents\n\n| Timestamp | Type | Source | Status |\n|---|---|---|---|\n', 'utf8');
    }
    fs.appendFileSync(this.incidentLog, logEntry, 'utf8');

    // 2. Add to Hash Blacklist if content provided
    if (secretContent) {
      const hash = crypto.createHash('sha256').update(secretContent).digest('hex');
      let blacklist = [];
      if (fs.existsSync(this.blacklistPath)) {
        try {
          blacklist = JSON.parse(fs.readFileSync(this.blacklistPath, 'utf8'));
        } catch (e) {
          blacklist = [];
        }
      }
      if (!blacklist.includes(hash)) {
        blacklist.push(hash);
        fs.writeFileSync(this.blacklistPath, JSON.stringify(blacklist, null, 2), 'utf8');
      }
    }
  }

  /**
   * Standardized discovery reporting for toolkit engines.
   */
  async reportDiscovery(file, description) {
    if (fs.existsSync(this.registryPath)) {
      try {
        const registry = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
        // Logic to ensure registry is aware of new files if needed
      } catch (e) {
        // Silent failure for registry parsing
      }
    }
    console.log(`[UMA] Discovery reported: ${file} - ${description}`);
  }
}

module.exports = new UmaBridge();
