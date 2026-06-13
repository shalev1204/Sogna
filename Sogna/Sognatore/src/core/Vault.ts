import { FS as fs, Color } from '@Sogna/Curator';
import { Guardian } from './Guardian.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Sogna Vault - The Encrypted Secret Store
 * Handles persistent storage of sensitive credentials using Guardian encryption.
 */
export class Vault {
    private static instance: Vault;
    private readonly vaultPath: string;
    private cache: Record<string, string> = {};

    private constructor() {
        // Resolve path to memory/operational/vault/secrets.bin
        const sognatoreRoot = path.join(__dirname, '..', '..');
        this.vaultPath = path.resolve(sognatoreRoot, '..', 'memory', 'operational', 'vault', 'secrets.bin');
        this.load();
    }

    public static getInstance(): Vault {
        if (!Vault.instance) {
            Vault.instance = new Vault();
        }
        return Vault.instance;
    }

    /**
     * Loads and decrypts the vault content.
     */
    private load(): void {
        if (!fs.existsSync(this.vaultPath)) {
            this.cache = {};
            return;
        }

        try {
            const encryptedData = fs.readFileSync(this.vaultPath, 'utf8');
            const decrypted = Guardian.getInstance().unsealData<Record<string, string>>(encryptedData);
            if (decrypted) {
                this.cache = decrypted;
            }
        } catch (error) {
            console.error(Color.red(`[VAULT] Failed to load secrets: ${error}`));
            this.cache = {};
        }
    }

    /**
     * Persists the current cache to the encrypted vault file.
     */
    private save(): void {
        try {
            const sealed = Guardian.getInstance().sealData(this.cache);
            fs.writeFileSync(this.vaultPath, sealed, 'utf8');
            console.log(Color.green(`[VAULT] Secrets synchronized and sealed at: ${path.basename(this.vaultPath)}`));
        } catch (error) {
            console.error(Color.red(`[VAULT] Critical failure during sealing: ${error}`));
        }
    }

    /**
     * Stores a secret in the vault.
     */
    public setSecret(key: string, value: string): void {
        this.cache[key] = value;
        this.save();
    }

    /**
     * Retrieves a secret from the vault.
     */
    public getSecret(key: string): string | undefined {
        return this.cache[key];
    }

    /**
     * Lists all secret keys (not values) for auditing.
     */
    public listKeys(): string[] {
        return Object.keys(this.cache);
    }
    
    /**
     * Injects vault secrets into process.env for compatibility.
     */
    public inject(): void {
        for (const [key, value] of Object.entries(this.cache)) {
            process.env[key] = value;
        }
        console.log(Color.dim(`[VAULT] Injected ${Object.keys(this.cache).length} secrets into environment.`));
    }
}
