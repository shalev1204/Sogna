
import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

/**
 * Sognatore Guardian - The Security & Privacy Sentinel
 * Replaces Phoenix security logic with a native, integrated engine.
 */
import { EnvOracle } from './utils/EnvOracle.js';

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
    this.SECRET_KEY = process.env.GUARDIAN_SECRET || '';
    
    // Strict Validation: No more hardcoded fallbacks in  Mode
    if (!this.SECRET_KEY || this.SECRET_KEY.length < 32) {
      console.error(chalk.red.bold('\n[CRITICAL_SECURITY_ERROR] GUARDIAN_SECRET is missing, too short, or compromised!'));
      console.error(chalk.yellow('Sognatore requires a 32+ character GUARDIAN_SECRET to maintain  Integrity.'));
      console.error(chalk.dim('Please update your .env file immediately. System is running in Restricted/Fail-Safe mode.'));
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error(' Security Breach: Insufficient Guardian Secret in Production.');
      }
      
      // Fail-Safe for construction phase: Use a temporary session-bound key if absolutely necessary, 
      // but warn loudly and do not persist data with it if possible.
      this.SECRET_KEY = crypto.randomBytes(32).toString('hex');
    }
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
      /class\s+\w+\s+\{.*(calc|eval|process|secure).*\}/is, // Heuristic for logic classes
      /[a-f0-9]{32,}/i, // Long hex strings (potential hashes/keys)
      /(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/ // Base64 blobs
    ];

    // Additional Entropy Heuristic: High density of non-prose characters
    const nonAlphaNumeric = (code.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const entropyScore = nonAlphaNumeric / code.length;
    
    return sensitivePatterns.some(pattern => pattern.test(code)) || (entropyScore > 0.4 && code.length > 100);
  }

  /**
   * Sanitizes prompts by removing path patterns and potential sensitive data.
   */
  public sanitizePrompt(prompt: string): string {
    let sanitized = prompt;
    
    // Obfuscate local paths (e.g., C:\Users\carle\ -> USER_ROOT\)
    const userRootPattern = new RegExp(path.join('C:', 'Users', '[^/\\\\]+'), 'gi');
    sanitized = sanitized.replace(userRootPattern, '<<PROTECTED_ROOT>>');

    // Remove specific potential markers of "AI Generated" if present
    sanitized = sanitized.replace(/As an AI engineer/gi, 'Directly');
    
    return sanitized;
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
    const criticalPaths = [
      path.join(targetDir, 'src', 'core'),
      path.join(targetDir, 'resources', 'skills'),
      path.join(targetDir, 'resources', 'config', 'agents.md'),
      path.join(targetDir, '../toolkit/scripts'), // Mutual Integrity with the Brain
      path.join(targetDir, '../.architectural_map.md') // Visibility integrity
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
