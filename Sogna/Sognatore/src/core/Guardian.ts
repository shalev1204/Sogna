
import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

/**
 * Sognatore Guardian - The Security & Privacy Sentinel
 * Replaces Phoenix security logic with a native, integrated engine.
 */
export class Guardian {
  private static instance: Guardian;
  private readonly SECRET_KEY = process.env.GUARDIAN_SECRET || 'sognatore_master_key_2026';

  private constructor() {}

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
      /\(\s*.*\s*\)\s*=>\s*\{.*[+\-*\/].*\}/, // Heuristic for arrow functions with math logic
      /class\s+\w+\s+\{.*(calc|eval|process|secure).*\}/is // Heuristic for logic classes
    ];

    return sensitivePatterns.some(pattern => pattern.test(code));
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
  public sealData(data: any): string {
    const json = JSON.stringify(data);
    const cipher = crypto.createCipheriv('aes-256-cbc', 
        crypto.scryptSync(this.SECRET_KEY, 'salt', 32), 
        Buffer.alloc(16, 0)
    );
    let encrypted = cipher.update(json, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  public unsealData(encrypted: string): any {
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', 
          crypto.scryptSync(this.SECRET_KEY, 'salt', 32), 
          Buffer.alloc(16, 0)
      );
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (e) {
      return null;
    }
  }
}
