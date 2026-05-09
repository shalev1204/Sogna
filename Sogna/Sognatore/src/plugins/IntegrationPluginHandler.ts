import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import { IntegrationPluginConfig } from './PluginTypes.js';

// In-memory registry for custom integration plugins
const _registeredIntegrations = new Map<string, any>();

export class IntegrationPluginHandler {
  /**
   * Register a custom integration plugin.
   *
   * @param pluginConfig - Validated integration plugin config
   * @returns Success status and optional error message
   */
  public static register(pluginConfig: IntegrationPluginConfig): { success: boolean; error?: string } {
    if (!pluginConfig || pluginConfig.type !== 'integration') {
      return { success: false, error: 'Invalid plugin config: type must be "integration"' };
    }

    const name = pluginConfig.name;

    if (_registeredIntegrations.has(name)) {
      return { success: false, error: `Integration plugin "${name}" is already registered` };
    }

    const intDef = {
      name: name,
      description: pluginConfig.description,
      webhook_url: pluginConfig.webhook_url,
      events: pluginConfig.events || [],
      payload_template: (pluginConfig as any).payload_template || '{"event": "{{event.type}}", "message": "{{event.message}}"}',
      headers: (pluginConfig as any).headers || {},
      timeout_ms: (pluginConfig as any).timeout_ms || 5000,
      retry_count: (pluginConfig as any).retry_count || 1,
      registered_at: new Date().toISOString(),
    };

    _registeredIntegrations.set(name, intDef);
    return { success: true };
  }

  /**
   * Unregister a custom integration plugin.
   *
   * @param pluginName - Name of the integration to remove
   * @returns Success status and optional error message
   */
  public static unregister(pluginName: string): { success: boolean; error?: string } {
    if (!_registeredIntegrations.has(pluginName)) {
      return { success: false, error: `Integration plugin "${pluginName}" is not registered` };
    }

    _registeredIntegrations.delete(pluginName);
    return { success: true };
  }

  /**
   * Render a template string with event data.
   * Replaces {{event.field}} patterns with actual event values.
   *
   * @param template - Template string
   * @param event - Event data
   * @returns Rendered string
   */
  public static renderTemplate(template: string, event: any): string {
    if (!template || typeof template !== 'string') return template || '';

    return template.replace(/\{\{event\.(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const parts = path.split('.');
      let value = event;
      for (const part of parts) {
        if (value === null || value === undefined) return '';
        value = value[part];
      }
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      // JSON-safe escape: handles quotes, backslashes, control chars
      return JSON.stringify(String(value)).slice(1, -1);
    });
  }

  /**
   * Handle an event by sending it to the integration webhook.
   * Fire-and-toolkitt with timeout.
   *
   * @param pluginConfig - The integration plugin config
   * @param event - The event data
   * @returns Promise resolving to the result of the event handling
   */
  public static async handleEvent(
    pluginConfig: IntegrationPluginConfig, 
    event: any
  ): Promise<{ sent: boolean; status?: number; error?: string }> {
    const webhookUrl = pluginConfig.webhook_url;
    const timeoutMs = (pluginConfig as any).timeout_ms || 5000;
    const headers = { ...((pluginConfig as any).headers || {}), 'Content-Type': 'application/json' };

    // Render payload template
    const payloadTemplate = (pluginConfig as any).payload_template || '{"event": "{{event.type}}", "message": "{{event.message}}"}';
    const payload = IntegrationPluginHandler.renderTemplate(payloadTemplate, event);

    return new Promise((resolve) => {
      try {
        if (!webhookUrl) {
          return resolve({ sent: false, error: 'No webhook URL provided' });
        }
        const url = new URL(webhookUrl);
        const isHttps = url.protocol === 'https:';
        const reqFn = isHttps ? httpsRequest : httpRequest;

        const options = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            ...headers,
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: timeoutMs,
        } as any;

        const req = reqFn(options, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            resolve({ sent: true, status: res.statusCode });
          });
        });

        req.on('error', (err) => {
          resolve({ sent: false, error: err.message });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ sent: false, error: `Timeout after ${timeoutMs}ms` });
        });

        req.write(payload);
        req.end();
      } catch (err: any) {
        resolve({ sent: false, error: err.message });
      }
    });
  }

  /**
   * Get integrations subscribed to a specific event type.
   *
   * @param eventType - The event type
   * @returns Matching integration definitions
   */
  public static getByEvent(eventType: string): any[] {
    return Array.from(_registeredIntegrations.values()).filter(
      i => i.events.includes(eventType) || i.events.includes('*')
    );
  }

  /**
   * List all registered integration plugins.
   *
   * @returns Array of integration definitions
   */
  public static listRegistered(): any[] {
    return Array.from(_registeredIntegrations.values());
  }

  /**
   * Clear all registered integrations (primarily for testing).
   */
  public static _clearAll(): void {
    _registeredIntegrations.clear();
  }
}
