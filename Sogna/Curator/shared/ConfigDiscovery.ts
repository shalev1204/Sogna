import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

export interface SognaConfig {
    securityTier: 'standard' | 'high' | 'max';
    maxReadSize: number;
    maxOutputSize: number;
    strictMode: boolean;
    anonymizeLogs: boolean;
    swarmTimeout: number;
    [key: string]: any;
}

const DEFAULT_CONFIG: SognaConfig = {
    securityTier: 'high',
    maxReadSize: 2 * 1024 * 1024, // 2MB
    maxOutputSize: 16384, // 16KB
    strictMode: true,
    anonymizeLogs: true,
    swarmTimeout: 300000 // 5m
};

export class ConfigDiscovery {
    private static instance: ConfigDiscovery;
    private currentConfig: SognaConfig;

    private constructor() {
        this.currentConfig = this.loadConfig();
    }

    public static getInstance(): ConfigDiscovery {
        if (!ConfigDiscovery.instance) {
            ConfigDiscovery.instance = new ConfigDiscovery();
        }
        return ConfigDiscovery.instance;
    }

    private loadConfig(): SognaConfig {
        let config = { ...DEFAULT_CONFIG };

        // 1. User config (~/.sognarc.json)
        const userConfigPath = path.join(os.homedir(), '.sognarc.json');
        if (fs.existsSync(userConfigPath)) {
            try {
                const userConfig = fs.readJsonSync(userConfigPath);
                config = { ...config, ...userConfig };
            } catch (e) {
                console.error(`[CONFIG ERROR] Failed to load user config: ${userConfigPath}`);
            }
        }

        // 2. Project config (.sognarc.json in current directory or workspace root)
        const projectConfigPath = path.join(process.cwd(), '.sognarc.json');
        if (fs.existsSync(projectConfigPath)) {
            try {
                const projectConfig = fs.readJsonSync(projectConfigPath);
                config = { ...config, ...projectConfig };
            } catch (e) {
                console.error(`[CONFIG ERROR] Failed to load project config: ${projectConfigPath}`);
            }
        }

        // 3. Local env (.env overlaps/overrides)
        dotenv.config();
        if (process.env.SOGNA_SECURITY_TIER) config.securityTier = process.env.SOGNA_SECURITY_TIER as any;
        if (process.env.SOGNARE_QUALITY_TIER === 'apex') config.securityTier = 'max';

        return config;
    }

    public getConfig(): SognaConfig {
        return this.currentConfig;
    }

    public get<K extends keyof SognaConfig>(key: K): SognaConfig[K] {
        return this.currentConfig[key];
    }
}
