import { Color, Env, Exec } from '@Sogna/Curator';
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git' && !file.startsWith('.')) {
        walk(fullPath, callback);
      }
    } else {
      callback(fullPath);
    }
  }
}

let modified = 0;

walk(root, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. CHALK -> COLOR
    if (content.includes('import chalk from \'chalk\'') || content.includes('import { "import { Exec, Color, Env, Strings, execa } from ['"]execa['"];?/g, execa } from \'execa\'') || content.includes('')) {
        content = content.replace(/import chalk from ['"]chalk['"];?/g, "");
        content = content.replace(/chalk\./g, 'Color.');
    }

    // 2. DOTENV -> ENV
    if (content.includes('import * as dotenv from \'dotenv\'') || content.includes('Env.discover();')) {
        content = content.replace(/import \* as dotenv from ['"]dotenv['"];?/g, "");
        content = content.replace(/import ['"]dotenv\/config['"];?/g, "\nEnv.discover();");
        content = content.replace(/dotenv\.config\({ path: (.*) }\);?/g, 'Env.load($1);');
    }

    // 3. EXECA -> EXEC
    if (content.includes('')) {
        content = content.replace(/");
        content = content.replace(/execa\(/g, 'Exec.command(');
    }

    // 4. SLUGIFY -> STRINGS
    if (content.includes('import slugify from \'slugify\'') || content.includes('')) {
        content = content.replace(/import slugify from ['"]slugify['"];?/g, "");
        content = content.replace(/slugify\(/g, 'Strings.Strings.slugify(');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Migrated to native toolkit: ${filePath}`);
        modified++;
    }
  }
});

console.log(`Finished migrating ${modified} files.`);
