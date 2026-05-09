import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const SKILLS_DIR = path.join(_dirname, '..', '..', 'Sognatore', 'resources', 'skills');

const DOMAINS = {
  engineering: ['app', 'web', 'react', 'angular', 'vue', 'js', 'ts', 'node', 'python', 'java', 'go', 'rust', 'csharp', 'cpp', 'code', 'api', 'frontend', 'backend', 'test', 'git', 'flutter', 'mobile', 'ios', 'android', 'swift', 'kotlin', 'dart', 'html', 'css', 'sass', 'webpack', 'vite', 'graphql', 'rest', 'pwa', 'expo', 'native', 'compiler', 'bug', 'debug'],
  operations_security: ['cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'k8s', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci', 'cd', 'server', 'linux', 'ubuntu', 'windows', 'monitor', 'log', 'deploy', 'perf', 'sre', 'sec', 'audit', 'pentest', 'hacker', 'attack', 'vulnerability', 'firewall', 'crypt', 'auth', 'identity', 'threat', 'compliance', 'security', 'password', 'jwt', 'tls', 'ssh', 'proxy', 'cdn', 'cloudflare'],
  data_ai: ['data', 'ml', 'ai', 'agent', 'deep', 'system', 'analytics', 'sql', 'db', 'database', 'prompt', 'llm', 'rag', 'vector', 'search', 'nlp', 'vision', 'train', 'inference', 'bigdata', 'spark', 'kafka', 'postgres', 'mongo', 'redis', 'elasticsearch', 'excel', 'csv', 'json', 'yaml', 'pandas', 'numpy', 'tensor', 'pytorch', 'colab', 'notebook'],
  business_product: ['biz', 'marketing', 'sales', 'product', 'pm', 'ux', 'design', 'legal', 'contract', 'hr', 'support', 'finance', 'investor', 'startup', 'strategy', 'email', 'crm', 'growth', 'seo', 'ads', 'campaign', 'slack', 'discord', 'trello', 'jira', 'notion', 'customer', 'success', 'brand', 'content', 'copy', 'social', 'adsense', 'shopify', 'stripe', 'paypal'],
};

const DEFAULT_DOMAIN = 'utilities';

async function organize() {
  console.log('🚀 SOGNATORE: Initiating  DOMAIN CLASSIFCATION...');

  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`Error: Skills directory not found at ${SKILLS_DIR}`);
    return;
  }

  // Create Domain Directories
  Object.keys(DOMAINS).forEach(d => {
    const dPath = path.join(SKILLS_DIR, d);
    if (!fs.existsSync(dPath)) fs.mkdirSync(dPath, { recursive: true });
  });
  if (!fs.existsSync(path.join(SKILLS_DIR, DEFAULT_DOMAIN))) {
    fs.mkdirSync(path.join(SKILLS_DIR, DEFAULT_DOMAIN), { recursive: true });
  }

  const items = fs.readdirSync(SKILLS_DIR);
  let movedCount = 0;

  for (const item of items) {
    const itemPath = path.join(SKILLS_DIR, item);
    
    // Skip if it is one of our new domain folders or not a directory
    if (Object.keys(DOMAINS).includes(item) || item === DEFAULT_DOMAIN) continue;
    if (!fs.statSync(itemPath).isDirectory()) continue;

    const lowerItem = item.toLowerCase();
    let assigned = false;

    for (const [domain, keywords] of Object.entries(DOMAINS)) {
      if (keywords.some(k => lowerItem.includes(k))) {
fs.renameSync(itemPath, path.join(SKILLS_DIR, domain, item));
        assigned = true;
        break;
      }
    }

    if (!assigned) {
fs.renameSync(itemPath, path.join(SKILLS_DIR, DEFAULT_DOMAIN, item));
    }
    movedCount++;
  }

  console.log(`✅ SUCCESS: ${movedCount} skills classified into  Domains.`);
}

organize().catch(console.error);
