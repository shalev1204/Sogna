import { Color, FS as fs } from '@Sogna/Curator';

import * as JavaScriptObfuscator from 'javascript-obfuscator';

import * as path from 'path';
import * as crypto from 'crypto';

import * as os from 'os';

/**
 * Sognatore Guardian - The Security & Privacy Sentinel
 * Replaces Phoenix security logic with a native, integrated engine.
 */
import { EnvOracle } from './utils/EnvOracle.js';
import { MemoryHub } from './memory/MemoryHub.js';
import { ConfigDiscovery } from '@Sogna/Curator/shared/ConfigDiscovery.js';
import { Hub, SecurityState } from '../Sentinel-Sognatore/Hub.js';
import { Shield } from '../Sentinel-Sognatore/Shield.js';

/**
 * Sognatore Guardian - The Security & Privacy Sentinel
 * Replaces Phoenix security logic with a native, integrated engine.
 */
export class Guardian {
  private static instance: Guardian;
  private readonly SECRET_KEY: string;

  private constructor() {
    // High-Assurance Envar Discovery
    EnvOracle.load();
    const config = ConfigDiscovery.getInstance().getConfig();
    this.SECRET_KEY = process.env.GUARDIAN_SECRET || config.guardianSecret || '';
    
    // Strict Validation: No more hardcoded fallbacks
    if (!this.SECRET_KEY || this.SECRET_KEY.length < 32) {
      console.error(Color.red.bold('\n[CRITICAL_SECURITY_ERROR] GUARDIAN_SECRET is missing or insufficient!'));
      
      if (config.securityTier === 'max') {
        throw new Error('Security Breach: Insufficient Guardian Secret.');
      }
      
      this.SECRET_KEY = crypto.randomBytes(32).toString('hex');
    }

    // --- 🔒 VAULT INTEGRATION ---
    this.syncVault();

    // MANDATORY BOOT GATE: Validate Sentinel status and Signatures
    this.enforceSecurity();
  }

  private async syncVault(): Promise<void> {
    try {
        const { Vault } = await import('./Vault.js');
        Vault.getInstance().inject();
    } catch (e) {
        // Vault initialization handled
    }
  }

  /**
   * Enforces Sentinel security by checking status and signatures.
   */
  private async enforceSecurity(): Promise<void> {
    const hub = Hub.getInstance();
    
    // 1. status Check
    if (hub.getState() === SecurityState.PANIC) {
        console.log(Color.red.bold('🚨 [GUARDIAN] Sentinel is unresponsive! Entering Panic Mode.'));
        await hub.recoverSentinel();
        if (hub.getState() === SecurityState.PANIC) {
            throw new Error(`Sentinel Integrity Breach: Unsigned critical file detected.`);
        }
    }

    // 2. Critical Integrity Signature Check
    const sognatoreRoot = hub.getSognatoreRoot();
    const toolkitRoot = path.join(sognatoreRoot, '..', 'Curator');

    const criticalFiles = [
        path.join(sognatoreRoot, 'src', 'core', 'Guardian.ts'),
        path.join(toolkitRoot, 'engines', 'Sentinel', 'bin', 'sentinel-veto.js')
    ];

    for (const file of criticalFiles) {
        if (!hub.validateSignature(file)) {
            console.error(Color.red(`[CRITICAL] Unauthorized file modification! No valid Sentinel signature for: ${path.basename(file)}`));
            throw new Error(`Sentinel Integrity Breach: Unsigned critical file detected.`);
        }
    }

    console.log(Color.green('🛡️ [GUARDIAN] Sentinel security validation passed. Project is secure.'));
  }

  public static getInstance(): Guardian {
    if (!Guardian.instance) {
      Guardian.instance = new Guardian();
    }
    return Guardian.instance;
  }

  /**
   * Performs advanced obfuscation on generated code to protect IP and avoid tracking.
   */
  public obfuscateCode(code: string): string {
    if (!this.analyzeSensitivity(code)) {
      console.log('[GUARDIAN] Code analyzed: Low sensitivity. Skipping heavy obfuscation.');
      return code;
    }

    console.log('[GUARDIAN] Sensitive logic detected! Shielding code...');
    try {
      const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1, // Full protection
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        numbersToExpressions: true,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        stringArray: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayThreshold: 1,
        unicodeEscapeSequence: true
      });
      return obfuscationResult.getObfuscatedCode();
    } catch (error) {
      console.error('[GUARDIAN] Obfuscation failed, returning original code as fallback.');
      return code;
    }
  }

  /**
   * Autonomously detects if code contains sensitive logic or secrets.
   */
  public analyzeSensitivity(code: string): boolean {
    const sensitivePatterns = [
      /algorithm/i, /logic/i, /secret/i, /key/i, /token/i, /password/i,
      /crypto/i, /auth/i, /payment/i, /pricing/i, /formula/i, /strategy/i,
      /db_conn/i, /apikey/i, /credential/i, /private/i,
      /\(\s*.*\s*\)\s*=>\s*\{.*[+\-*/].*\}/, // Heuristic for arrow functions with math logic
      /class\s+\w+\s+\{[\s\S]*(calc|eval|process|secure)[\s\S]*\}/i, // Heuristic for logic classes
      /[a-f0-9]{32,}/i, // Long hex strings (potential hashes/keys)
      /(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/ // Base64 blobs
    ];

    // Additional Entropy Heuristic: High density of non-prose characters
    const nonAlphaNumeric = (code.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const entropyScore = nonAlphaNumeric / code.length;
    
    return sensitivePatterns.some(pattern => pattern.test(code)) || (entropyScore > 0.4 && code.length > 100);
  }

  /**
   * Sanitizes prompts by removing path patterns, sensitive names, and potential leaks.
   */
  public sanitizePrompt(prompt: string): string {
    let sanitized = Shield.sanitizePrompt(prompt);
    
    // SMART INTEL REDACTION (Project Anonymization)
    sanitized = this.redactIntel(sanitized);

    // Remove specific markers of "AI Generated" if present
    sanitized = sanitized.replace(/As an AI engineer/gi, 'Directly');
    
    return sanitized;
  }

  /**
   * Redacts project-specific intelligence keywords to ensure log neutrality.
   * Replaces Sogna/Sognatore with generic placeholders for external analysis (Sentinel).
   */
  public redactIntel(text: string): string {
    let redacted = text;
    const config = ConfigDiscovery.getInstance().getConfig();
    
    const mappings: Record<string, string> = {
      'Sognatore': '[CORE_ENGINE]',
      'Sogna': '[PROJECT_ALPHA]',
      'Antigravity': '[TOOLKIT_OMEGA]',
      'Sentinel': '[SECURITY_LAYER]',
      ...(config.customRedactions || {}) // Consume from .sognarc.json
    };

    // 1. Redact Project Keywords
    for (const [key, placeholder] of Object.entries(mappings)) {
      const regex = new RegExp(key, 'gi');
      redacted = redacted.replace(regex, placeholder);
    }

    // 2. Redact OS Username for privacy
    try {
      const username = os.userInfo().username;
      if (username) {
        const userRegex = new RegExp(username, 'gi');
        redacted = redacted.replace(userRegex, '[OFFICER_NAME]');
      }
    } catch (e) {
      // Username detection failed
    }

    return redacted;
  }

  /**
   * "Seals" the logs/state with a basic layer of protection.
   */
  public sealData<T>(data: T): string {
    const json = JSON.stringify(data);
    const cipher = crypto.createCipheriv('aes-256-cbc', 
        crypto.scryptSync(this.SECRET_KEY, 'salt', 32), 
        Buffer.alloc(16, 0)
    );
    let encrypted = cipher.update(json, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  public unsealData<T>(encrypted: string): T | null {
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', 
          crypto.scryptSync(this.SECRET_KEY, 'salt', 32), 
          Buffer.alloc(16, 0)
      );
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted) as T;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[GUARDIAN] Decryption/Parsing failed: ${message}`);
      return null;
    }
  }

  /**
   * Validates the integrity of the Sognatore core and skills.
   * Computes a recursive hash to detect tampering.
   */
  public validateIntegrity(targetDir: string = '.'): string {
    const hash = crypto.createHash('sha256');
    const sognatoreRoot = Hub.getInstance().getSognatoreRoot();
    const toolkitRoot = path.join(sognatoreRoot, '..', 'toolkit');

    const criticalPaths = [
      path.join(targetDir, 'src', 'core'),
      path.join(targetDir, 'resources', 'skills'),
      path.join(targetDir, 'resources', 'config', 'agents.md'),
      path.join(toolkitRoot, 'scripts'), // Mutual Integrity with the processor
      path.join(sognatoreRoot, '..', '.architectural_map.md') // Visibility integrity
    ];

    criticalPaths.forEach(p => {
      const fullPath = path.isAbsolute(p) ? p : path.resolve(p);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          this.hashDirectory(fullPath, hash);
        } else {
          hash.update(fs.readFileSync(fullPath));
        }
      }
    });

    return hash.digest('hex');
  }

  private hashDirectory(dir: string, hash: crypto.Hash) {
    const files = fs.readdirSync(dir).sort();
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        this.hashDirectory(fullPath, hash);
      } else {
        hash.update(file);
        hash.update(fs.readFileSync(fullPath));
      }
    });
  }
}
