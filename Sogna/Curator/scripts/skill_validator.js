import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Validates a single skill SKILL.md contents.
 */
export function validateSkillContent(content, filePath = 'SKILL.md') {
  const errors = [];
  
  // 1. Extract YAML frontmatter
  const yamlRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = content.match(yamlRegex);
  if (!match) {
    errors.push('Falta el bloque YAML frontmatter delimitado por --- al inicio del archivo.');
    return { valid: false, name: '', id: '', errors };
  }
  
  const yamlContent = match[1];
  const lines = yamlContent.split(/\r?\n/);
  const metadata = {};
  
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.substring(0, colonIdx).trim();
      const val = line.substring(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      metadata[key] = val;
    }
  }
  
  // 2. Validate mandatory frontmatter properties
  if (metadata.type !== 'skill') {
    errors.push(`La propiedad 'type' en el frontmatter debe ser exactamente 'skill'. Recibido: '${metadata.type || ''}'`);
  }
  if (!metadata.name) {
    errors.push("Falta la propiedad obligatoria 'name' en el frontmatter.");
  }
  if (!metadata.id) {
    errors.push("Falta la propiedad obligatoria 'id' en el frontmatter.");
  } else if (!/^skill-[a-z0-9-]+$/.test(metadata.id)) {
    errors.push(`La propiedad 'id' ('${metadata.id}') debe seguir el formato '^skill-[a-z0-9-]+$'.`);
  }
  if (!metadata.description) {
    errors.push("Falta la propiedad obligatoria 'description' en el frontmatter.");
  }
  if (!metadata['allowed-tools']) {
    errors.push("Falta la propiedad obligatoria 'allowed-tools' en el frontmatter.");
  }
  
  // 3. Validate Markdown structure
  const cleanContent = content.replace(yamlRegex, '').trim();
  
  // Validate H1 header
  const h1Match = cleanContent.match(/^#\s+(.*)/m);
  if (!h1Match) {
    errors.push('Falta la cabecera principal H1 (# Título de Habilidad).');
  } else if (metadata.name) {
    const normalizedH1 = h1Match[1].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedName = metadata.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normalizedH1.includes(normalizedName) && !normalizedName.includes(normalizedH1)) {
      errors.push(`El título H1 ('${h1Match[1].trim()}') no coincide razonablemente con el 'name' del frontmatter ('${metadata.name}').`);
    }
  }
  
  // Validate Decision Checklist section
  const hasChecklist = /decision checklist/i.test(cleanContent);
  if (!hasChecklist) {
    errors.push("Falta la sección obligatoria '## Decision Checklist'.");
  }
  
  // Validate Anti-Patterns section
  const hasAntiPatterns = /anti-pattern/i.test(cleanContent) || /anti\s*patterns/i.test(cleanContent);
  if (!hasAntiPatterns) {
    errors.push("Falta la sección obligatoria '## Anti-Patterns'.");
  }
  
  // 4. Validate script references inside ## Script / ## Scripts section
  const hasScriptSection = /##\s*Scripts?/i.test(cleanContent);
  if (hasScriptSection) {
    const lines = cleanContent.split('\n');
    let inScriptSection = false;
    for (const line of lines) {
      if (/^##\s*Scripts?/i.test(line)) {
        inScriptSection = true;
        continue;
      }
      if (inScriptSection && /^##?/.test(line) && !/^##\s*Scripts?/i.test(line)) {
        inScriptSection = false; // Left the scripts section
      }
      
      if (inScriptSection && line.includes('|')) {
        const scriptMatch = line.match(/`?(scripts\/[a-zA-Z0-9_\-\.]+)/i);
        if (scriptMatch) {
          const scriptRelPath = scriptMatch[1];
          const scriptName = path.basename(scriptRelPath);
          const skillDir = path.dirname(filePath);
          const resolvedScriptPath = path.join(skillDir, 'scripts', scriptName);
          if (!fs.existsSync(resolvedScriptPath)) {
            errors.push(`El script listado '${scriptRelPath}' no existe físicamente en el subdirectorio de scripts de la habilidad.`);
          }
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    name: metadata.name || '',
    id: metadata.id || '',
    errors
  };
}

/**
 * Validates a single skill directory.
 */
export function validateSkillDirectory(skillDir) {
  const skillFile = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    return {
      valid: false,
      name: path.basename(skillDir),
      id: '',
      errors: ['Falta el archivo descriptor SKILL.md obligatorio.']
    };
  }
  
  try {
    const content = fs.readFileSync(skillFile, 'utf8');
    return validateSkillContent(content, skillFile);
  } catch (e) {
    return {
      valid: false,
      name: path.basename(skillDir),
      id: '',
      errors: [`Error de lectura de archivo: ${e.message}`]
    };
  }
}

/**
 * Validates all skills in Curator/skills recursively.
 */
export function validateAllSkills(skillsPath) {
  const results = {};
  if (!fs.existsSync(skillsPath)) return results;
  
  const entries = fs.readdirSync(skillsPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(skillsPath, entry.name);
      if (['scripts', 'tests', 'node_modules', '.git'].includes(entry.name)) continue;
      
      const result = validateSkillDirectory(fullPath);
      results[entry.name] = result;
    }
  }
  return results;
}

// Self-executing CLI Block
const currentFilePath = fileURLToPath(import.meta.url);
const runFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (runFilePath === path.resolve(currentFilePath)) {
  const defaultPath = path.resolve(path.dirname(currentFilePath), '..', 'skills');
  console.log(`\n=== SOGNA CURATOR SKILLS VALIDATION GATE ===`);
  console.log(`Scanning skills in: ${defaultPath}\n`);
  
  const results = validateAllSkills(defaultPath);
  let totalSkills = 0;
  let validSkills = 0;
  let failedSkills = 0;
  
  for (const [dirName, res] of Object.entries(results)) {
    totalSkills++;
    if (res.valid) {
      validSkills++;
      console.log(`  \x1b[32m✅ [VALID] \x1b[0m ${dirName} (ID: ${res.id})`);
    } else {
      failedSkills++;
      console.error(`  \x1b[31m❌ [ERROR] \x1b[0m ${dirName}`);
      for (const err of res.errors) {
        console.error(`     - \x1b[33m${err}\x1b[0m`);
      }
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`  Total Scanned : ${totalSkills}`);
  console.log(`  Valid         : \x1b[32m${validSkills}\x1b[0m`);
  console.log(`  Failed        : \x1b[31m${failedSkills}\x1b[0m`);
  
  if (failedSkills > 0) {
    process.exit(1);
  } else {
    console.log(`\x1b[32m\n✅ All skills are structural and structurally intact!\x1b[0m\n`);
    process.exit(0);
  }
}
