#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const ROOT = path.join(_dirname, '..', '..');
const SKILLS_DIR = path.join(ROOT, 'Sognatore', 'resources', 'skills');

const errors = [];
const warnings = [];

const VALID_RISK_LEVELS = new Set(['safe', 'critical', 'offensive', 'unknown']);

function addError(skillName, message) {
    errors.push(`[${skillName}] ERROR: ${message}`);
}

function addWarning(skillName, message) {
    warnings.push(`[${skillName}] WARNING: ${message}`);
}

function parseYAML(yamlString) {
    const lines = yamlString.split('\n');
    const data = {};
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (match) {
            let key = match[1].trim();
            let value = match[2].trim();
            if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
                value = value.slice(1, -1);
            }
            data[key] = value;
        }
    }
    return data;
}

function validateSkill(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(ROOT, filePath);

    // 1. Frontmatter check (Simple, robust regex)
    // Looking for --- at the start, followed by content, then ---
    const fmMatch = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*/);
    if (!fmMatch) {
        addError(relativePath, 'Missing frontmatter header block at line 1');
        return;
    }

    const data = parseYAML(fmMatch[1]);

    // Required fields check
if (!data.name) addError(relativePath, 'Missing mandatory "name" field in frontmatter');
if (!data.description) addError(relativePath, 'Missing mandatory "description" field in frontmatter');
    if (!data.risk) addError(relativePath, 'Missing mandatory "risk" field (Risk Pattern violation)');
    if (!data.version) addWarning(relativePath, 'Missing "version" field');

    // Value validation
    if (data.risk && !VALID_RISK_LEVELS.has(data.risk)) {
        addError(relativePath, `Invalid risk level: "${data.risk}". Allowed: ${[...VALID_RISK_LEVELS].join(', ')}`);
    }

    // Deprecated fields
    if (data.id) addWarning(relativePath, 'Deprecated "id" field found');
    if (data.category) addWarning(relativePath, 'Deprecated "category" field found');

    // 2. Content Hardening check
    if (!content.includes('## Sentinel Security Policy')) {
        addError(relativePath, 'Missing mandatory "## Sentinel Security Policy" section');
    }

    // 3. Language check (Basic)
    const spanishIndicators = ['Soy ', 'Mi función', 'instrucciones', 'hoja de ruta', 'español'];
    for (const indicator of spanishIndicators) {
        if (content.includes(indicator)) {
            addWarning(relativePath, `Potential Spanish content detected: "${indicator}"`);
            break;
        }
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
            validateSkill(fullPath);
        }
    }
}

console.log('🔍 Sognatore: Running system-wide skill validation...');
console.log(`📍 Path: ${SKILLS_DIR}`);

if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`✘ Error: Skills directory not found at ${SKILLS_DIR}`);
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
    process.exit(1);
}

walk(SKILLS_DIR);

if (warnings.length > 0) {
    console.warn(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.slice(0, 20).forEach(w => console.warn(w));
    if (warnings.length > 20) console.warn('... and more.');
}

if (errors.length > 0) {
    console.error(`\n✘ ERRORS (${errors.length}):`);
    errors.slice(0, 20).forEach(e => console.error(e));
    if (errors.length > 20) console.error('... and more.');
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
    process.exit(1);
}

console.log(`\n✅ SUCCESS: ${errors.length === 0 ? 'All' : 'Most'} assets are compliant with Sognatore High-Assurance standards.`);
