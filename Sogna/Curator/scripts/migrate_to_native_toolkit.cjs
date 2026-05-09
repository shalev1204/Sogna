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
    if (content.includes("import chalk from 'chalk'") || content.includes('import chalk from "chalk"')) {
        content = content.replace(/import chalk from ['"]chalk['"];?/g, "import { Color } from '@Sogna/Curator';");
        content = content.replace(/chalk\./g, 'Color.');
    }

    // 2. DOTENV -> ENV
    if (content.includes("import * as dotenv from 'dotenv'") || content.includes('import "dotenv/config"') || content.includes("import 'dotenv/config'")) {
        content = content.replace(/import \* as dotenv from ['"]dotenv['"];?/g, "import { Env } from '@Sogna/Curator';");
        content = content.replace(/import ['"]dotenv\/config['"];?/g, "import { Env } from '@Sogna/Curator';\nEnv.discover();");
        content = content.replace(/dotenv\.config\({ path: (.*) }\);?/g, 'Env.load($1);');
    }

    // 3. EXECA -> EXEC
    if (content.includes("import { execa } from 'execa'") || content.includes('import { execa } from "execa"')) {
        content = content.replace(/import { execa } from ['"]execa['"];?/g, "import { Exec } from '@Sogna/Curator';");
        content = content.replace(/execa\(/g, 'Exec.command(');
    }

    // 4. SLUGIFY -> STRINGS
    if (content.includes("import slugify from 'slugify'") || content.includes('import slugify from "slugify"')) {
        content = content.replace(/import slugify from ['"]slugify['"];?/g, "import { Strings } from '@Sogna/Curator';");
        content = content.replace(/slugify\(/g, 'Strings.slugify(');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Migrated to native toolkit: ${filePath}`);
        modified++;
    }
  }
});

console.log(`Finished migrating ${modified} files.`);
