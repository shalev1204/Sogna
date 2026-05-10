const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');

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

let modifiedCount = 0;

walk(root, (filePath) => {
  if (filePath.includes('ModelRegistry.ts')) return;
  if (filePath.includes('safe_migrate.cjs')) return;
  if (filePath.includes('package-lock.json') || filePath.includes('pnpm-lock.yaml')) return;

  const isCode = filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.tsx');
  if (!isCode) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. EXECA REPLACEMENT
  content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]execa['"];?/g, (match, p1) => {
    const parts = p1.split(',').map(s => s.trim());
    let imports = ['Exec'];
    if (parts.some(p => p.includes('ExecaError'))) imports.push('ExecaError');
    if (parts.some(p => p.includes('ExecaChildProcess'))) imports.push('ExecaChildProcess');
    return `import { ${imports.join(', ')} } from '@Sogna/Curator';`;
  });
  content = content.replace(/import\s+execa\s+from\s+['"]execa['"];?/g, "import { Exec } from '@Sogna/Curator';");

  // 2. DOTENV REPLACEMENT
  content = content.replace(/import\s+(?:dotenv|\*\s+as\s+dotenv)\s+from\s+['"]dotenv['"];?/g, "import { Env } from '@Sogna/Curator';");
  content = content.replace(/import\s+['"]dotenv\/config['"];?/g, "import { Env } from '@Sogna/Curator';\nEnv.load();");
  content = content.replace(/import\s+dotenv\s+from\s+['"]dotenv['"];?/g, "import { Env } from '@Sogna/Curator';");
  
  // Fix dotenv.config({ path: ... })
  content = content.replace(/dotenv\.config\(\{\s*path:\s*([^}]*)\s*\}\)/g, 'Env.load($1)');
  content = content.replace(/dotenv\.config\(\)/g, 'Env.load()');

  // 3. FS-EXTRA REPLACEMENT
  content = content.replace(/import\s+(?:fs|\*\s+as\s+fs)\s+from\s+['"]fs-extra['"];?/g, "import { FS as fs } from '@Sogna/Curator';");
  content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]fs-extra['"];?/g, "import { FS as fs } from '@Sogna/Curator';\nconst { $1 } = fs;");

  // 4. FIX EXEC CALLS
  content = content.replace(/\bexeca\(/g, 'Exec.run(');
  content = content.replace(/\bExec\.command\(([^,]+),\s*\[/g, 'Exec.run($1, [');
  content = content.replace(/\bExec\.command\(([^,]+),\s*args/g, 'Exec.run($1, args');

  // 5. DEDUPLICATE CURATOR IMPORTS & ADD MISSING ONES
  const curatorImportRegex = /import\s+\{([^}]*)\}\s+from\s+['"]@Sogna\/Curator['"];?/g;
  const curatorImports = content.match(curatorImportRegex);
  
  let allNamed = [];
  if (curatorImports) {
    curatorImports.forEach(imp => {
      const parts = imp.match(/\{([^}]*)\}/)[1].split(',').map(s => s.trim());
      allNamed.push(...parts);
    });
  }

  // Heuristic for missing imports
  if (content.includes('Exec.') && !allNamed.includes('Exec')) allNamed.push('Exec');
  if (content.includes('Env.') && !allNamed.includes('Env')) allNamed.push('Env');
  if (content.includes('Color.') && !allNamed.includes('Color')) allNamed.push('Color');
  if (content.includes('FS.') && !allNamed.includes('FS')) allNamed.push('FS');
  if (content.includes(': ExecaError') || content.includes('as ExecaError') && !allNamed.includes('ExecaError')) allNamed.push('ExecaError');
  if (content.includes(': ExecaChildProcess') || content.includes('as ExecaChildProcess') && !allNamed.includes('ExecaChildProcess')) allNamed.push('ExecaChildProcess');

  if (allNamed.length > 0) {
    const uniqueNamedSet = new Set(allNamed.filter(n => n && !n.includes('FS as fs')));
    const hasFsAsFs = allNamed.some(n => n.includes('FS as fs'));
    const uniqueNamed = [...uniqueNamedSet].sort();
    
    let importList = uniqueNamed.join(', ');
    if (hasFsAsFs) {
        importList = importList ? `${importList}, FS as fs` : 'FS as fs';
    }
    
    const finalImport = `import { ${importList} } from '@Sogna/Curator';`;

    if (curatorImports) {
      curatorImports.forEach(imp => {
        content = content.replace(imp + '\n', '');
        content = content.replace(imp, '');
      });
    }

    if (content.startsWith('#!')) {
      const firstLineEnd = content.indexOf('\n');
      const shebang = content.substring(0, firstLineEnd + 1);
      const rest = content.substring(firstLineEnd + 1);
      content = shebang + finalImport + '\n' + rest;
    } else {
      content = finalImport + '\n' + content;
    }
  }

  // 6. NOMENCLATURE PURGE
  // Identity Purge
  content = content.replace(/\bgrandilocuencia\b/gi, 'integridad');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
    modifiedCount++;
  }
});

console.log(`Successfully processed ${modifiedCount} files.`);
