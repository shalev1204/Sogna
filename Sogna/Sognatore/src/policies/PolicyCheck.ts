#!/usr/bin/env node
import { PolicyEngine } from './PolicyEngine.js';

const enforcementPoint = process.argv[2];
if (!enforcementPoint) {
  process.stderr.write('Usage: node PolicyCheck.js <enforcement_point> [context_json]\n');
  process.exit(1);
}

let context = {};
if (process.argv[3]) {
  try {
    context = JSON.parse(process.argv[3]);
  } catch (e: any) {
    process.stderr.write(`Invalid context JSON: ${e.message}\n`);
    process.exit(1);
  }
}

const projectDir = process.env.SOGNATORE_PROJECT_DIR || process.cwd();
let engine: PolicyEngine;

try {
  engine = new PolicyEngine(projectDir);
} catch {
  // No policies configured - allow by default
  process.stdout.write(JSON.stringify({ allowed: true, decision: 'ALLOW', reason: 'No policies configured' }));
  process.exit(0);
}

const result = engine.evaluate(enforcementPoint, context);
process.stdout.write(JSON.stringify(result));

if (!result.allowed) {
  process.exit(result.requiresApproval ? 2 : 1);
}
process.exit(0);
