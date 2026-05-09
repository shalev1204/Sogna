import { Color } from '@Sogna/Curator';
import readline from 'readline';
import fs from 'fs';
import path from 'path';


export class SetupWizard {
  private rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  private async ask(question: string, defaultValue?: string): Promise<string> {
    const prompt = defaultValue ? `${question} (default: ${defaultValue}): ` : `${question}: `;
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue || '');
      });
    });
  }

  async run() {
    console.log(Color.bold.cyan('\n🔱 Asistente de Configuración Sognatore\n'));
    console.log('Este asistente configurará tu entorno para la autonomía total.\n');

    const anthropicKey = await this.ask('Clave API de Anthropic (clau-...)');
    const googleKey = await this.ask('Clave API de Google Gemini');
    const kimiKey = await this.ask('Clave API de Kimi (Moonshot AI)');
    const deepseekKey = await this.ask('Clave API de DeepSeek (sk-...)');
    const openrouterKey = await this.ask('Clave API de OpenRouter (sk-or-...)');
    const openaiKey = await this.ask('Clave API de OpenAI (sk-...)');
    
    console.log(Color.yellow('\n--- Configurar Sistema de Actualizaciones ---'));
    const masterPath = await this.ask('Ruta local del "Sognatore Maestro" (ej: C:\\Users\\...\\sognatore)', process.cwd());
    const githubOrigin = await this.ask('URL del Repositorio en GitHub (opcional)', 'https://github.com/shalev1204/Sognatore.git');

    this.rl.close();

    const envContent = `# 🔱 Sognatore Configuration
# core Platino
ANTHROPIC_API_KEY=${anthropicKey}

# Desarrollador Oro/Plata
GOOGLE_API_KEY=${googleKey}
KIMI_API_KEY=${kimiKey}
DEEPSEEK_API_KEY=${deepseekKey}
OPENROUTER_API_KEY=${openrouterKey}

# Especialista Versátil
OPENAI_API_KEY=${openaiKey}

# Ecosistema Sognatore
SOGNATORE_MASTER_PATH=${masterPath}
SOGNATORE_GITHUB_ORIGIN=${githubOrigin}
SOGNATORE_BACKUP_STRATEGY=hybrid
`;

    const envPath = path.join(process.cwd(), '.env');
    fs.writeFileSync(envPath, envContent);

    console.log(Color.green('\n✔ ¡Configuración guardada con éxito en .env!'));
    console.log('Ahora puedes ejecutar ' + Color.bold('npm run start -- doctor') + ' para verificar tus APIs.\n');
  }
}
