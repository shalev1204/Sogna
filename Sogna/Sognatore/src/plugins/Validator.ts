import { readFileSync } from 'fs';
import { join } from 'path';
import { 
  PluginType, 
  PluginConfig, 
  ValidationResult 
} from './PluginTypes.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Built-in agent names that cannot be overridden by plugins
export const BUILTIN_AGENT_NAMES = [
  'eng-frontend', 'eng-backend', 'eng-database', 'eng-mobile',
  'eng-api', 'eng-qa', 'eng-perf', 'eng-infra',
  'ops-devops', 'ops-sre', 'ops-security', 'ops-monitor',
  'ops-incident', 'ops-release', 'ops-cost', 'ops-compliance',
  'biz-marketing', 'biz-sales', 'biz-finance', 'biz-legal',
  'biz-support', 'biz-hr', 'biz-investor', 'biz-partnerships',
  'data-ml', 'data-eng', 'data-analytics',
  'prod-pm', 'prod-design', 'prod-techwriter',
  'growth-hacker', 'growth-community', 'growth-success', 'growth-lifecycle',
  'review-code', 'review-business', 'review-security',
  'orch-planner', 'orch-sub-planner', 'orch-judge', 'orch-coordinator',
];

// Dangerous shell metacharacters
const SHELL_INJECTION_PATTERN = /[|;&`<>]|\$\(|`.*`|\$\{(?!ENV_)|\n|\r/;

// Valid plugin types
export const VALID_PLUGIN_TYPES: PluginType[] = ['agent', 'quality_gate', 'integration', 'mcp_tool'];

// Schema file mapping
const SCHEMA_FILES: Record<PluginType, string> = {
  agent: 'agent.json',
  quality_gate: 'quality_gate.json',
  integration: 'integration.json',
  mcp_tool: 'mcp_tool.json',
};

export class PluginValidator {
  private schemasDir: string;
  private _schemaCache: Record<string, any> = {};

  /**
   * Create a new PluginValidator.
   * @param schemasDir - Path to the schemas directory
   */
  constructor(schemasDir?: string) {
    this.schemasDir = schemasDir || join(__dirname, 'schemas');
  }

  /**
   * Load a JSON schema for a plugin type.
   * @param pluginType - The plugin type
   * @returns The parsed schema or null
   */
  private _loadSchema(pluginType: PluginType): any | null {
    if (this._schemaCache[pluginType]) {
      return this._schemaCache[pluginType];
    }

    const schemaFile = SCHEMA_FILES[pluginType];
    if (!schemaFile) {
      return null;
    }

    try {
      const schemaPath = join(this.schemasDir, schemaFile);
      const content = readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(content);
      this._schemaCache[pluginType] = schema;
      return schema;
    } catch (err) {
      return null;
    }
  }

  /**
   * Validate a plugin configuration.
   * @param pluginConfig - The plugin configuration to validate
   * @returns Validation result with boolean and errors list
   */
  public validate(pluginConfig: any): ValidationResult {
    const errors: string[] = [];

    // 1. Check that config is an object
    if (!pluginConfig || typeof pluginConfig !== 'object' || Array.isArray(pluginConfig)) {
      return { valid: false, errors: ['Plugin config must be a non-null object'] };
    }

    // 2. Check required base fields
    if (!pluginConfig.type) {
      errors.push('Missing required field: type');
    }
    if (!pluginConfig.name) {
      errors.push('Missing required field: name');
    }

    // If we cannot determine type, return early
    if (!pluginConfig.type) {
      return { valid: false, errors };
    }

    // 3. Check plugin type is valid
    if (!VALID_PLUGIN_TYPES.includes(pluginConfig.type)) {
      errors.push(`Unknown plugin type: "${pluginConfig.type}". Valid types: ${VALID_PLUGIN_TYPES.join(', ')}`);
      return { valid: false, errors };
    }

    // 4. Load and validate against schema
    const schema = this._loadSchema(pluginConfig.type);
    if (schema) {
      const schemaErrors = this._validateAgainstSchema(pluginConfig, schema);
      errors.push(...schemaErrors);
    }

    // 5. Security checks
    const securityErrors = this._securityChecks(pluginConfig);
    errors.push(...securityErrors);

    // 6. Built-in name collision check (for agents)
    if (pluginConfig.type === 'agent' && pluginConfig.name) {
      if (BUILTIN_AGENT_NAMES.includes(pluginConfig.name)) {
        errors.push(`Name "${pluginConfig.name}" conflicts with a built-in agent type. Custom agents must use unique names.`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate config against a JSON schema (simplified validator).
   */
  private _validateAgainstSchema(config: any, schema: any): string[] {
    const errors: string[] = [];

    // Check required fields
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (config[field] === undefined || config[field] === null || config[field] === '') {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Check property types and constraints
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties as Record<string, any>)) {
        const value = config[key];
        if (value === undefined || value === null) {
          continue; 
        }

        // Type check
        if (propSchema.type) {
          const typeValid = this._checkType(value, propSchema.type);
          if (!typeValid) {
            errors.push(`Field "${key}" must be of type ${propSchema.type}, got ${typeof value}`);
            continue;
          }
        }

        // Const check
        if (propSchema.const !== undefined && value !== propSchema.const) {
          errors.push(`Field "${key}" must be "${propSchema.const}"`);
        }

        // Enum check
        if (propSchema.enum && !propSchema.enum.includes(value)) {
          errors.push(`Field "${key}" must be one of: ${propSchema.enum.join(', ')}`);
        }

        // Pattern check (string)
        if (propSchema.pattern && typeof value === 'string') {
          const regex = new RegExp(propSchema.pattern);
          if (!regex.test(value)) {
            errors.push(`Field "${key}" does not match pattern ${propSchema.pattern}`);
          }
        }

        // MaxLength check (string)
        if (propSchema.maxLength !== undefined && typeof value === 'string') {
          if (value.length > propSchema.maxLength) {
            errors.push(`Field "${key}" exceeds maximum length of ${propSchema.maxLength} (got ${value.length})`);
          }
        }

        // MinItems check (array)
        if (propSchema.minItems !== undefined && Array.isArray(value)) {
          if (value.length < propSchema.minItems) {
            errors.push(`Field "${key}" must have at least ${propSchema.minItems} items`);
          }
        }

        // Minimum check (integer/number)
        if (propSchema.minimum !== undefined && typeof value === 'number') {
          if (value < propSchema.minimum) {
            errors.push(`Field "${key}" must be >= ${propSchema.minimum}`);
          }
        }

        // Maximum check (integer/number)
        if (propSchema.maximum !== undefined && typeof value === 'number') {
          if (value > propSchema.maximum) {
            errors.push(`Field "${key}" must be <= ${propSchema.maximum}`);
          }
        }
      }

      // Check for additional properties (if additionalProperties is false)
      if (schema.additionalProperties === false) {
        const allowedKeys = Object.keys(schema.properties);
        for (const key of Object.keys(config)) {
          if (!allowedKeys.includes(key)) {
            errors.push(`Unknown field: "${key}" is not allowed`);
          }
        }
      }
    }

    return errors;
  }

  /**
   * Check if a value matches a JSON schema type.
   */
  private _checkType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
      case 'integer':
        return typeof value === 'number' && (type !== 'integer' || Number.isInteger(value));
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value) && value !== null;
      default:
        return true;
    }
  }

  /**
   * Run security checks on a plugin config.
   */
  private _securityChecks(config: any): string[] {
    const errors: string[] = [];

    // Check command fields for shell injection
    const commandFields = ['command'];
    for (const field of commandFields) {
      if (typeof config[field] === 'string') {
        if (SHELL_INJECTION_PATTERN.test(config[field])) {
          errors.push(`Security: field "${field}" contains potentially dangerous shell metacharacters (|, ;, &, $(), backticks). Use simple commands only.`);
        }
      }
    }

    // Check prompt_template for size
    if (typeof config.prompt_template === 'string') {
      if (config.prompt_template.length > 10000) {
        errors.push(`Field "prompt_template" exceeds maximum length of 10000`);
      }
    }

    // Check payload_template for injection
    if (typeof config.payload_template === 'string') {
      const templateVarPattern = /\{\{(?!event\.)[^}]+\}\}/g;
      const disallowed = config.payload_template.match(templateVarPattern);
      if (disallowed && disallowed.length > 0) {
        errors.push(`Security: payload_template contains disallowed template variables: ${disallowed.join(', ')}. Only {{event.*}} patterns are allowed.`);
      }
    }

    // Check webhook_url is HTTPS or localhost
    if (typeof config.webhook_url === 'string') {
      const url = config.webhook_url.toLowerCase();
      if (!url.startsWith('https://') && !url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
        errors.push('Security: webhook_url must use HTTPS or localhost');
      }
    }

    return errors;
  }
}
