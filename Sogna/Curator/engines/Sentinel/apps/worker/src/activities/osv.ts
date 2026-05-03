import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface OSVReport {
  package: string;
  version: string;
  vulns: any[];
}

const CACHE_FILE = path.join(process.cwd(), '.osv-cache.json');

function loadCache(): Record<string, any> {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCache(cache: Record<string, any>) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Actividad: checkOSVDatabase
 * Reemplaza el antiguo sentinel_scan.py con capacidades asíncronas
 * y caché eficiente.
 */
export async function checkOSVDatabase(packages: Record<string, string>, ecosystem: string = "npm"): Promise<OSVReport[]> {
  const url = "https://api.osv.dev/v1/query";
  const results: OSVReport[] = [];
  const cache = loadCache();
  let cacheModified = false;

  console.log(`[SENTINEL SHIELD] Auditando ${Object.keys(packages).length} dependencias contra OSV...`);

  for (const [name, version] of Object.entries(packages)) {
    const cleanVersion = version.replace(/[\^~]/g, '');
    const cacheKey = `${ecosystem}:${name}@${cleanVersion}`;

    if (cache[cacheKey] && cache[cacheKey].timestamp > Date.now() - 1000 * 60 * 60 * 24) {
       // Cache hit: Válido por 24 horas
       if (cache[cacheKey].vulns && cache[cacheKey].vulns.length > 0) {
           results.push({
               package: name,
               version: cleanVersion,
               vulns: cache[cacheKey].vulns
           });
       }
       continue;
    }

    try {
      const query = {
        version: cleanVersion,
        package: { name, ecosystem }
      };
      
      const response = await axios.post(url, query, { timeout: 10000 });
      
      let vulns = [];
      if (response.data && response.data.vulns) {
        vulns = response.data.vulns;
        results.push({
          package: name,
          version: cleanVersion,
          vulns
        });
      }

      // Grabar en caché
      cache[cacheKey] = {
          timestamp: Date.now(),
          vulns
      };
      cacheModified = true;

    } catch (e) {
      console.warn(`[!] Error al consultar estado de ${name}: ${(e as Error).message}`);
    }
  }

  if (cacheModified) {
      saveCache(cache);
  }

  return results;
}
