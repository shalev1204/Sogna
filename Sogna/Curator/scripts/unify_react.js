import fs from 'fs';
import path from 'path';

function findPackageJsons(dir) {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
        if (entry.name === 'node_modules') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(findPackageJsons(fullPath));
        } else if (entry.name === 'package.json') {
            results.push(fullPath);
        }
    }
    return results;
}

const packages = findPackageJsons(process.cwd());

console.log(`Found ${packages.length} package.json files.`);

packages.forEach(pkgPath => {
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        let changed = false;

        const sections = ['dependencies', 'devDependencies', 'peerDependencies'];
        sections.forEach(section => {
            if (pkg[section]) {
                if (pkg[section]['react']) {
                    pkg[section]['react'] = 'catalog:';
                    changed = true;
                }
                if (pkg[section]['react-dom']) {
                    pkg[section]['react-dom'] = 'catalog:';
                    changed = true;
                }
                if (pkg[section]['@types/react']) {
                    pkg[section]['@types/react'] = 'catalog:';
                    changed = true;
                }
                if (pkg[section]['@types/react-dom']) {
                    pkg[section]['@types/react-dom'] = 'catalog:';
                    changed = true;
                }
            }
        });

        if (changed) {
            console.log(`Updating ${pkgPath}...`);
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        }
    } catch (e) {
        console.error(`Error processing ${pkgPath}: ${e.message}`);
    }
});
