import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log("\n--- 🛡️ SOGNA SETUP WIZARD ---");
  console.log("Configurando tu nueva instancia soberana...\n");

  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = await fs.readFile(envPath, 'utf8');
  }

  const keys = [
    { id: 'PERPLEXITY_API_KEY', label: 'Perplexity API Key (Omnisciencia - Búsqueda)' },
    { id: 'MANUS_API_KEY', label: 'Manus API Key (Omnisciencia - Acción Delegada)' },
    { id: 'VERCEL_TOKEN', label: 'Vercel Token (Acción en la Nube - Despliegue)' },
    { id: 'SUPABASE_URL', label: 'Supabase URL (Backend)' },
    { id: 'SUPABASE_ANON_KEY', label: 'Supabase Anon Key (Backend)' }
  ];

  for (const key of keys) {
    if (!envContent.includes(key.id)) {
      const val = await question(`🔑 ${key.label}: `);
      if (val) {
        envContent += `\n${key.id}=${val}`;
      }
    }
  }

  await fs.writeFile(envPath, envContent.trim() + '\n');
  console.log("\n✅ Configuración guardada en .env");
  console.log("🚀 Sogna está listo para despertar.");
  rl.close();
}

setup().catch(console.error);
