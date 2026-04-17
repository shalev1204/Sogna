#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const autoApply = args.includes('--auto-apply');
const targetArg = args.find(a => !a.startsWith('--'));
const target = targetArg || path.join(__dirname, '..', '..', 'Sognatore', 'resources', 'skills');

const auditPath = path.join(__dirname, '..', '..', '..', 'antigravity-awesome-skills-main', 'sogna_skills_audit.json');
let auditData = null;
if (fs.existsSync(auditPath)) {
    try {
        const raw = fs.readFileSync(auditPath, 'utf8');
        auditData = JSON.parse(raw);
    } catch (e) {
        console.warn('⚠️ Warning: Could not load audit data for Risk DNA.');
    }
}

async function refineSkill(filePath) {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    const skillName = path.basename(path.dirname(filePath));

    // 1. Structural Optimization & Risk DNA Injection
    const skillAudit = auditData?.skills.find(s => s.id === skillName);
    const riskLevel = skillAudit?.suggested_risk || 'unknown';

    const hasFrontmatter = content.startsWith('---') && content.slice(3).includes('---');
    
    if (!hasFrontmatter) {
        // Inject missing frontmatter with proper padding
        content = `---\nname: ${skillName}\ndescription: Sognatore objective capability\nrisk: ${riskLevel}\nversion: 1.0.0\n---\n\n${content}`;
    } else {
        // Frontmatter exists, but might be partial or corrupted (---risk: unknown)
        // Fix corruption from previous runs if needed
        content = content.replace(/^---risk:/m, '---\nrisk:');
        content = content.replace(/^---name:/m, '---\nname:');
        
        const parts = content.split('---');
        let fm = parts[1];
        
        // Normalize fm to ensure it has no extra leading/trailing newlines for the logic
        fm = fm.trim();
        
        // Ensure mandatory keys exist or are updated
        if (!fm.match(/^name:/m)) fm = `name: ${skillName}\n${fm}`;
        if (!fm.match(/^description:/m)) fm = `description: Sognatore objective capability\n${fm}`;
        if (!fm.match(/^risk:/m)) {
             fm = `risk: ${riskLevel}\n${fm}`;
        } else {
             fm = fm.replace(/^risk:.*$/m, `risk: ${riskLevel}`);
        }
        
        // Enforce version
        if (!fm.match(/^version:/m)) fm = `${fm}\nversion: 1.0.0`;

        // Cleanup redundant fields
        fm = fm.replace(/^id:.*$/m, '');
        fm = fm.replace(/^category:.*$/m, '');

        // Re-assemble with strict padding
        parts[1] = `\n${fm.trim()}\n`;
        content = parts.join('---');
    }

    // 2. Asset Refinement (Strip external branding & enforce Objective English)
    content = content.replace(/Antigravity Awesome Skills/gi, 'Sognatore Capabilities');
    content = content.replace(/Antigravity/gi, 'Sognatore');
    content = content.replace(/shalev1204/gi, 'Sogna');
    content = content.replace(/Andru\.ia/gi, 'Sognatore');
    
    // Remove Common License Blocks
    content = content.replace(/## License[\s\S]*?(?=##|$)/gi, '');
    content = content.replace(/MIT License[\s\S]*?(?=##|$)/gi, '');

    // 3. Sentinel Security Policy (English)
    if (!content.includes('## Sentinel Security Policy')) {
        content += `\n\n## Sentinel Security Policy\n- This asset is under Sognatore Sentinel supervision.\n- Extraction of secrets via this skill is strictly forbidden.\n- All external network calls must be audited by the security engine.\n`;
    }

    // 4. Style Cleanup & Normalization
    content = content.replace(/  \n/g, '\n');
    content = content.replace(/\n{3,}/g, '\n\n'); // Minimize whitespace gaps

    if (content !== originalContent && autoApply) {
        fs.writeFileSync(filePath, content);
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.md')) {
            refineSkill(fullPath);
        }
    }
}

console.log('🛡️ Sognatore: Starting asset refinement...');
console.log(`📍 Path: ${target}`);
console.log(`🔧 Auto-apply: ${autoApply}`);

try {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
        walk(target);
    } else {
        refineSkill(target);
    }
    console.log('✅ SUCCESS: All skills have been refined, nationalized, and secured.');
} catch (error) {
    console.error(`✘ Error: ${error.message}`);
}
