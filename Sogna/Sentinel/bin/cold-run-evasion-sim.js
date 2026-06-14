/**
 * Cold-Run Evasion Simulation
 * Valida que sentinel-veto.js bloquea rutas fuera de ROOT_DIR y secuencias relativas engañosas.
 * Uso: node cold-run-evasion-sim.js [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const __dirnameSafe = __dirname;
const SENTINEL_BIN = path.join(__dirnameSafe, 'sentinel-veto.js');
const ROOT_DIR = path.resolve(__dirnameSafe, '../..');
const SIM_TMP_DIR = path.join(__dirnameSafe, '../.cold_run_sim');
const verbose = process.argv.includes('--verbose');

const OUTSIDE_WIN = path.resolve('C:/Windows/System32/drivers/etc/hosts');
const OUTSIDE_UNIX = '/etc/passwd';

/** @type {{ id: string; kind: 'cli'|'mcp'; vector: string; expectVeto: boolean; build: () => string|string[] }} */
const CASES = [
    {
        id: 'cli-traversal-dots',
        kind: 'cli',
        vector: '../../../Windows/System32',
        expectVeto: true,
        build: () => ['..', '..', '..', 'Windows', 'System32', 'drivers', 'etc', 'hosts'].join(path.sep),
    },
    {
        id: 'cli-traversal-backslash',
        kind: 'cli',
        vector: '..\\..\\..\\Windows',
        expectVeto: true,
        build: () => '..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts',
    },
    {
        id: 'cli-absolute-outside',
        kind: 'cli',
        vector: 'absolute path outside ROOT',
        expectVeto: true,
        build: () => (fs.existsSync(OUTSIDE_WIN) ? OUTSIDE_WIN : OUTSIDE_UNIX),
    },
    {
        id: 'cli-mixed-case-drive',
        kind: 'cli',
        vector: 'case-insensitive drive letter evasion',
        expectVeto: true,
        build: () => {
            const drive = path.parse(ROOT_DIR).root;
            return `${drive[0].toUpperCase()}${drive.slice(1).toLowerCase()}\\WiNdOwS\\System32\\drivers\\etc\\hosts`;
        },
    },
    {
        id: 'mcp-unix-traversal',
        kind: 'mcp',
        vector: 'args.path = ../../../etc/passwd',
        expectVeto: true,
        build: () =>
            JSON.stringify({
                tool: 'update_swarm_mission',
                args: {
                    mission: 'probe',
                    last_milestone: 'x',
                    path: '../../../etc/passwd',
                },
            }),
    },
    {
        id: 'mcp-win-traversal',
        kind: 'mcp',
        vector: 'args.file = ..\\..\\..\\Windows\\System32',
        expectVeto: true,
        build: () =>
            JSON.stringify({
                tool: 'update_swarm_mission',
                args: {
                    mission: 'probe',
                    last_milestone: 'x',
                    file: '..\\..\\..\\Windows\\System32\\config\\sam',
                },
            }),
    },
    {
        id: 'mcp-absolute-outside',
        kind: 'mcp',
        vector: 'args.target absolute outside ROOT',
        expectVeto: true,
        build: () =>
            JSON.stringify({
                tool: 'update_swarm_mission',
                args: {
                    mission: 'probe',
                    last_milestone: 'x',
                    target: fs.existsSync(OUTSIDE_WIN) ? OUTSIDE_WIN : OUTSIDE_UNIX,
                },
            }),
    },
    {
        id: 'mcp-unc-path',
        kind: 'mcp',
        vector: 'args.share = \\\\evil\\share\\payload',
        expectVeto: true,
        build: () =>
            JSON.stringify({
                tool: 'update_swarm_mission',
                args: {
                    mission: 'probe',
                    last_milestone: 'x',
                    share: '\\\\evil.corp\\share\\data',
                },
            }),
    },
    {
        id: 'mcp-nested-object',
        kind: 'mcp',
        vector: 'nested config.output',
        expectVeto: true,
        build: () =>
            JSON.stringify({
                tool: 'update_swarm_mission',
                args: {
                    mission: 'ok',
                    last_milestone: 'ok',
                    config: { output: path.join('..', '..', '..', 'tmp', 'exfil') },
                },
            }),
    },
    {
        id: 'mcp-legitimate-relative',
        kind: 'mcp',
        vector: 'in-tree relative path (control)',
        expectVeto: false,
        build: () =>
            JSON.stringify({
                tool: 'get_swarm_telemetry',
                args: {
                    ref: 'memory/operational/agent/active_state.json',
                },
            }),
    },
];

function ensureSimDir() {
    if (!fs.existsSync(SIM_TMP_DIR)) fs.mkdirSync(SIM_TMP_DIR, { recursive: true });
}

function runSentinel(args) {
    const result = spawnSync(process.execPath, [SENTINEL_BIN, ...args], {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        env: { ...process.env, SENTINEL_STRICT: 'true' },
        timeout: 15000,
    });
    const combined = `${result.stdout || ''}${result.stderr || ''}`;
    const vetoed =
        result.status !== 0 ||
        combined.includes('[CRITICAL]') ||
        combined.includes('[VETO]') ||
        combined.includes('EVASIÓN DE RUTA');
    return { code: result.status, output: combined, vetoed };
}

function runCase(testCase) {
    ensureSimDir();
    let args;
    if (testCase.kind === 'cli') {
        args = [testCase.build()];
    } else {
        const tmpName = `.sentinel_veto_tmp_${testCase.id}.json`;
        const tmpPath = path.join(SIM_TMP_DIR, tmpName);
        fs.writeFileSync(tmpPath, testCase.build(), 'utf-8');
        const rel = path.relative(ROOT_DIR, tmpPath).replace(/\\/g, '/');
        args = [rel];
    }

    const { code, output, vetoed } = runSentinel(args);
    const pass = vetoed === testCase.expectVeto;

    return {
        id: testCase.id,
        kind: testCase.kind,
        vector: testCase.vector,
        expectVeto: testCase.expectVeto,
        vetoed,
        exitCode: code,
        pass,
        output: verbose ? output : output.split('\n').filter(l => l.includes('CRITICAL') || l.includes('VETO') || l.includes('EVASIÓN')).join('\n'),
    };
}

function cleanup() {
    try {
        if (fs.existsSync(SIM_TMP_DIR)) {
            for (const f of fs.readdirSync(SIM_TMP_DIR)) {
                fs.unlinkSync(path.join(SIM_TMP_DIR, f));
            }
            fs.rmdirSync(SIM_TMP_DIR);
        }
    } catch (e) {
        // no bloquear salida por limpieza
    }
}

function main() {
    console.log('\n[COLD-RUN] Simulación de evasión de rutas — Sentinel Veto');
    console.log(`[COLD-RUN] ROOT_DIR: ${ROOT_DIR}`);
    console.log(`[COLD-RUN] Motor: ${SENTINEL_BIN}\n`);

    if (!fs.existsSync(SENTINEL_BIN)) {
        console.error('[COLD-RUN] ERROR: No se encontró sentinel-veto.js');
        process.exit(2);
    }

    const results = CASES.map(runCase);
    cleanup();

    let passed = 0;
    let failed = 0;

    for (const r of results) {
        const status = r.pass ? 'PASS' : 'FAIL';
        if (r.pass) passed++;
        else failed++;

        console.log(
            `[${status}] ${r.id} (${r.kind}) | esperado=${r.expectVeto ? 'VETO' : 'ALLOW'} | obtenido=${r.vetoed ? 'VETO' : 'ALLOW'} | exit=${r.exitCode}`
        );
        console.log(`         vector: ${r.vector}`);
        if (!r.pass && r.output) {
            console.log(`         salida: ${r.output.trim() || '(sin líneas CRITICAL/VETO)'}`);
        }
    }

    console.log(`\n[COLD-RUN] Resumen: ${passed}/${results.length} casos conformes, ${failed} fallos.\n`);

    process.exit(failed > 0 ? 1 : 0);
}

main();
