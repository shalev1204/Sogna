import { FailureClass } from './events/SognaEventBus.js';
import fs from 'fs';
import path from 'path';
export const RECOVERY_RECIPES = {
    [FailureClass.GIT]: {
        scenario: FailureClass.GIT,
        maxAttempts: 1,
        proactive: true,
        check: {
            command: 'git status'
        },
        steps: [
            { name: 'Abort Merge', command: 'git merge --abort', description: 'Aborting the conflicting merge to restore stable state.' }
        ]
    },
    [FailureClass.INFRA]: {
        scenario: FailureClass.INFRA,
        maxAttempts: 1,
        proactive: true,
        check: {
            command: 'ping -n 1 8.8.8.8'
        },
        steps: [
            { name: 'Proxy Reset', command: 'netsh winhttp reset proxy', description: 'Resetting Windows HTTP proxy configuration to restore connectivity.' },
            { name: 'NPM Cache Clean', command: 'npm cache clean --force', description: 'Cleaning NPM cache to resolve potential corruption.' }
        ]
    },
    [FailureClass.CREDENTIALS]: {
        scenario: FailureClass.CREDENTIALS,
        maxAttempts: 1,
        proactive: true,
        check: {
            action: async (cwd) => {
                const envPath = path.join(cwd, '.env');
                if (!fs.existsSync(envPath))
                    return true;
                const content = fs.readFileSync(envPath, 'utf8');
                return !content.includes('API_KEY') || content.includes('YOUR_KEY_HERE');
            }
        },
        steps: [
            { name: 'Env Verification', command: 'node Sognatore/dist/bin/sognatore.js doctor --auth', description: 'Triggering interactive authentication workflow.' }
        ]
    },
    [FailureClass.PERMISSION]: {
        scenario: FailureClass.PERMISSION,
        maxAttempts: 1,
        steps: [
            { name: 'Permission Audit', command: 'node Sognatore/dist/bin/sognatore.js doctor --fix-perms', description: 'Checking and fixing workspace permissions.' }
        ]
    },
    [FailureClass.API]: {
        scenario: FailureClass.API,
        maxAttempts: 1,
        steps: [
            { name: 'Credential Refresh', command: 'node Sognatore/dist/bin/sognatore.js doctor --check-api', description: 'Verifying LLM provider credentials.' }
        ]
    },
    [FailureClass.SANDBOX]: {
        scenario: FailureClass.SANDBOX,
        maxAttempts: 1,
        steps: [
            { name: 'Purify Sandbox', command: 'node toolkit/bin/purify.js', description: 'Cleaning the Docker sandbox environment.' }
        ]
    },
    [FailureClass.LSP]: {
        scenario: FailureClass.LSP,
        maxAttempts: 1,
        proactive: true,
        steps: [
            { name: 'Restart LSP', action: async () => { }, description: 'Restarting the language server bridge.' }
        ]
    }
};
