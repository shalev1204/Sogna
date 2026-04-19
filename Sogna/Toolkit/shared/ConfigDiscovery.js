import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
const DEFAULT_CONFIG = {
    securityTier: 'high',
    maxReadSize: 2 * 1024 * 1024, // 2MB
    maxOutputSize: 16384, // 16KB
    institutionalMode: true,
    anonymizeLogs: true,
    swarmTimeout: 300000 // 5m
};
export class ConfigDiscovery {
    static instance;
    currentConfig;
    constructor() {
        this.currentConfig = this.loadConfig();
    }
    static getInstance() {
        if (!ConfigDiscovery.instance) {
            ConfigDiscovery.instance = new ConfigDiscovery();
        }
        return ConfigDiscovery.instance;
    }
    loadConfig() {
        let config = { ...DEFAULT_CONFIG };
        // 1. User config (~/.sognarc.json)
        const userConfigPath = path.join(os.homedir(), '.sognarc.json');
        if (fs.existsSync(userConfigPath)) {
            try {
                const userConfig = fs.readJsonSync(userConfigPath);
                config = { ...config, ...userConfig };
            }
            catch (e) {
                console.error(`[CONFIG ERROR] Failed to load user config: ${userConfigPath}`);
            }
        }
        // 2. Project config (.sognarc.json in current directory or workspace root)
        const projectConfigPath = path.join(process.cwd(), '.sognarc.json');
        if (fs.existsSync(projectConfigPath)) {
            try {
                const projectConfig = fs.readJsonSync(projectConfigPath);
                config = { ...config, ...projectConfig };
            }
            catch (e) {
                console.error(`[CONFIG ERROR] Failed to load project config: ${projectConfigPath}`);
            }
        }
        // 3. Local env (.env overlaps/overrides)
        dotenv.config();
        if (process.env.SOGNA_SECURITY_TIER)
            config.securityTier = process.env.SOGNA_SECURITY_TIER;
        if (process.env.SOGNARE_QUALITY_TIER === 'apex')
            config.securityTier = 'apex';
        return config;
    }
    getConfig() {
        return this.currentConfig;
    }
    get(key) {
        return this.currentConfig[key];
    }
}
