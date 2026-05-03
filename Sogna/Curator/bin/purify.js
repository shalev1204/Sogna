import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ROOT = process.cwd();

// ANSI Colors
const RESET = "\x1b[0m";
const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";

const GHOST_PATTERNS = [
  'lint_report_*.json',
  'lint_output_*.txt',
  'debug-fm.js',
  'Audit.ts',
  'Audit.js',
  'sbp_conflict_resolution.md',
  '.turbo',
  'dist'
];

const TARGET_DIRS = [
  ROOT,
  path.join(ROOT, 'Sognatore'),
  path.join(ROOT, 'toolkit', 'engines', 'Predatore'),
  path.join(ROOT, 'toolkit', 'engines', 'Sentinel')
];

async function purify() {
  console.log(`${BLUE}--- Signa System Purification Engine ---${RESET}`);
  
  let purgedCount = 0;

  for (const dir of TARGET_DIRS) {
    if (!existsSync(dir)) continue;
    
    const files = await fs.readdir(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      
      const isMatch = GHOST_PATTERNS.some(pattern => {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(file);
      });

      if (isMatch) {
        try {
          if (existsSync(fullPath)) {
            const stats = await fs.stat(fullPath);
            if (stats.isDirectory()) {
              await fs.rm(fullPath, { recursive: true, force: true });
            } else {
              await fs.unlink(fullPath);
            }
            console.log(`${GREEN}  ✓ Purged: ${path.relative(ROOT, fullPath)}${RESET}`);
            purgedCount++;
          }
        } catch (e) {
          console.error(`${RED}  ✗ Failed to purge ${file}: ${e.message}${RESET}`);
        }
      }
    }
  }

  // Specialized cleanups
  const legacySource = path.join(ROOT, 'antigravity-awesome-skills-main');
  if (existsSync(legacySource)) {
    await fs.rm(legacySource, { recursive: true, force: true });
    console.log(`${GREEN}  ✓ Purged legacy source directory.${RESET}`);
    purgedCount++;
  }

  console.log(`${BLUE}\nPurification complete. ${purgedCount} artifacts eliminated.${RESET}`);
}

purify();
