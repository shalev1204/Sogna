import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
export class BlueprintAuditor {
    async audit(rootPath, blueprint) {
        const issues = [];
        // 1. Check Required Nodes
        for (const node of blueprint.requiredNodes) {
            const fullPath = path.join(rootPath, node.path);
            const exists = await fs.pathExists(fullPath);
            if (!exists) {
                issues.push({
                    type: 'MISSING',
                    node: node.path,
                    message: `Required ${node.type} missing: ${node.description}`,
                    severity: 'error'
                });
            }
            else {
                const stats = await fs.lstat(fullPath);
                const isDir = stats.isDirectory();
                if ((node.type === 'directory' && !isDir) || (node.type === 'file' && isDir)) {
                    issues.push({
                        type: 'MISSING',
                        node: node.path,
                        message: `Node found at ${node.path} but expected ${node.type}, found ${isDir ? 'directory' : 'file'}.`,
                        severity: 'error'
                    });
                }
            }
        }
        // 2. Scan for Veto Patterns (Quick scan for source files)
        if (blueprint.vetoRules.length > 0) {
            await this.scanForVetoes(rootPath, blueprint.vetoRules, issues);
        }
        // Calculate score (simple metric)
        const requiredCount = blueprint.requiredNodes.length;
        const errors = issues.filter(i => i.severity === 'error').length;
        const integrityScore = Math.max(0, 100 - (errors * (100 / (requiredCount || 1))));
        return {
            blueprintId: blueprint.id,
            blueprintName: blueprint.name,
            rootPath,
            issues,
            integrityScore
        };
    }
    async scanForVetoes(rootPath, rules, issues) {
        // Only scan text-based code files for vetoes to avoid false positives in data (e.g. JSON benchmarks)
        const allowedExtensions = ['.ts', '.js', '.py', '.sh', '.bash'];
        const scan = async (dir) => {
            const entries = await fs.readdir(dir);
            for (const entry of entries) {
                if (entry === 'node_modules' || entry === '.git')
                    continue;
                const fullPath = path.join(dir, entry);
                const stats = await fs.lstat(fullPath);
                if (stats.isDirectory()) {
                    // Skip known data/asset/build directories to avoid false positives in architectural audits
                    if (entry === 'resources' || entry === 'dist')
                        continue;
                    await scan(fullPath);
                }
                else if (stats.isFile() && allowedExtensions.includes(path.extname(entry))) {
                    const content = await fs.readFile(fullPath, 'utf8');
                    for (const rule of rules) {
                        if (new RegExp(rule.pattern).test(content)) {
                            issues.push({
                                type: 'VETO',
                                node: path.relative(rootPath, fullPath),
                                message: rule.message,
                                severity: rule.severity
                            });
                        }
                    }
                }
            }
        };
        await scan(rootPath);
    }
    renderReport(report) {
        let output = chalk.bold(`\nArchitecture Audit: ${report.blueprintName}\n`);
        output += `Status: ${report.integrityScore === 100 ? chalk.green('PASS') : chalk.red('DEVIATING')} (Integrity: ${report.integrityScore}%)\n`;
        output += `Root: ${report.rootPath}\n\n`;
        if (report.issues.length === 0) {
            output += chalk.green('  ✓ Architectural state matches the blueprint perfectly.\n');
            return output;
        }
        for (const issue of report.issues) {
            const color = issue.severity === 'error' ? chalk.red : chalk.yellow;
            const typeStr = chalk.bold(`[${issue.type}]`);
            output += color(`  ${typeStr} ${issue.node}\n`);
            output += chalk.dim(`           └─ ${issue.message}\n`);
        }
        return output;
    }
}
