import fs from 'fs';
import path from 'path';
import { LinearConfig, DEFAULT_STATUS_MAPPING } from './LinearTypes.js';

/**
 * Minimal YAML parser for flat and one-level-nested key-value pairs.
 */
export function parseSimpleYaml(content: string): any {
  const result: any = {};
  const lines = content.split('\n');
  let currentSection: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, '').trimEnd();
    if (!line.trim()) continue;

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    const kvMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    const value = kvMatch[2].trim();

    if (indent === 0 || (indent === 2 && currentSection === null)) {
      if (value === '' || value === '{}') {
        currentSection = key;
        result[key] = result[key] || {};
      } else {
        currentSection = null;
        result[key] = unquote(value);
      }
    } else if (indent >= 2 && currentSection) {
      const parts: string[] = currentSection.split('.');
      if (value === '' || value === '{}') {
        currentSection = parts.concat(key).join('.');
        setNested(result, parts.concat(key), {});
      } else {
        setNested(result, parts.concat(key), unquote(value));
      }
    }
  }

  return result;
}

function unquote(s: string): string | boolean | number {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return s;
}

function setNested(obj: any, keys: string[], value: any) {
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof current[keys[i]] !== 'object' || current[keys[i]] === null) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  const lastKey = keys[keys.length - 1];
  if (typeof value === 'object' && typeof current[lastKey] === 'object') {
    Object.assign(current[lastKey], value);
  } else {
    current[lastKey] = value;
  }
}

/**
 * Load Linear integration configuration.
 */
export function loadConfig(configDir?: string): LinearConfig | null {
  const dir = configDir || path.join(process.cwd(), '.sognatore');
  const yamlPath = path.join(dir, 'config.yaml');
  const jsonPath = path.join(dir, 'config.json');

  let parsed: any = null;

  if (fs.existsSync(yamlPath)) {
    const raw = fs.readFileSync(yamlPath, 'utf8');
    parsed = parseSimpleYaml(raw);
  } else if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    parsed = JSON.parse(raw);
  }

  if (!parsed) return null;

  const linear = parsed.integrations?.linear;
  if (!linear || typeof linear !== 'object') return null;

  if (!linear.api_key) {
    throw new Error('Linear integration config requires "api_key" field');
  }

  return {
    apiKey: linear.api_key,
    teamId: linear.team_id || null,
    webhookSecret: linear.webhook_secret || null,
    statusMapping: { ...DEFAULT_STATUS_MAPPING, ...(linear.status_mapping || {}) },
  };
}

export function validateConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config) return { valid: false, errors: ['Config is null'] };
  if (!config.apiKey || typeof config.apiKey !== 'string') {
    errors.push('apiKey is required and must be a string');
  }
  return { valid: errors.length === 0, errors };
}
