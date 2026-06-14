import fs from 'fs/promises';

export interface VetoReport {
    level: 'CLEAN' | 'WARNING' | 'CRITICAL';
    reason: string;
    location: string;
    solution: string;
}

/**
 * Data Leak Prevention Activity (The Sognatore Guardian Legacy)
 * Scans a file's content for exposed secrets or abnormally high entropy.
 */
export async function scanDataLeak(filePath: string): Promise<VetoReport> {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // 1. Patrones Determinísticos Letales
        const secretPatterns = [
            /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}/,      // GitHub Tokens
            /xox[p|b|o|a]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/, // Slack Tokens
            /AKIA[0-9A-Z]{16}/,                              // AWS Access Key ID
            /sk_live_[0-9a-zA-Z]{24}/,                       // Stripe Keys
            /-----BEGIN (?:PRIVATE|RSA|OPENSSH) KEY-----/,   // Claves Privadas
            /[a-f0-9]{32,}/i,                                // Cadenas Hex (usadas en GUARDIAN_SECRET u obfuscaion)
        ];

        for (const pattern of secretPatterns) {
            const match = content.match(pattern);
            if (match) {
                return {
                    level: 'CRITICAL',
                    reason: `Exposición de Secreto Crítico Detectado: Posible Token/Key expuesta -> ${pattern.source}`,
                    location: `Archivo: ${filePath}`,
                    solution: "Sentinel ha vetado tu commit. DEBES eliminar el secreto expuesto inmediatamente y usar variables de entorno (EnvOracle) para gestionarlo."
                };
            }
        }

        // 2. Análisis Crítico de Entropía (Bloques masivos no legibles)
        const nonAlphaNumeric = (content.match(/[^a-zA-Z0-9\s]/g) || []).length;
        const entropyScore = content.length > 0 ? nonAlphaNumeric / content.length : 0;
        
        if (entropyScore > 0.4 && content.length > 200) {
            return {
                level: 'WARNING',
                reason: `Entropía anormal detectada (${Math.round(entropyScore * 100)}%). El archivo parece ofuscado o contiene cargas útiles binarias.`,
                location: `Archivo: ${filePath}`,
                solution: "Revisar manualmente el código. Si es intencionado, el archivo debe añadirse a exclusiones o justificarse."
            };
        }

        return { level: 'CLEAN', reason: '', location: filePath, solution: '' };

    } catch (err: any) {
        return {
            level: 'CRITICAL',
            reason: `Error de Lectura al escanear archivo: ${err.message}`,
            location: `Archivo: ${filePath}`,
            solution: "Asegúrate de que el archivo existe y es legible antes del commit."
        };
    }
}
