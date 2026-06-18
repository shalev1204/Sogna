#!/usr/bin/env node
/**
 * SOGNA DREAM — Bootstrap de sesión (cadena unificada operador).
 * Por defecto: git pull --ff-only → pnpm install → esquinas → diagnóstico.
 *
 * Uso:
 *   node scripts/sogna-dream.mjs              # pull + bootstrap estándar
 *   node scripts/sogna-dream.mjs --fast       # sin install; MCP solo config
 *   node scripts/sogna-dream.mjs --full       # + sentinel:audit + mcp:amplifier (bajo demanda)
 *   node scripts/sogna-dream.mjs --no-pull      # omitir git pull
 *   node scripts/sogna-dream.mjs --no-install # omitir pnpm install
 *   node scripts/sogna-dream.mjs --start-services
 *   node scripts/sogna-dream.mjs --deploy-corners
 *   node scripts/sogna-dream.mjs --skip-chroma
 *   node scripts/sogna-dream.mjs --reindex-chroma
 *   node scripts/sogna-dream.mjs --json
 *
 * Sin pnpm instalado (Mac/Linux): ./dream.sh   |   Windows: dream.cmd
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectGitFingerprint, formatGitSection, resolveGitRoot } from "./lib/git-fingerprint.mjs";
import { checkEnv, formatEnvSection } from "./lib/env-checklist.mjs";
import { collectSkillsCatalog, formatCatalogSection, needsPnpmInstall } from "./lib/skills-catalog.mjs";
import { isEmbeddedLayout, sognaRoot as defaultSognaRoot } from "./corners-lib.mjs";
import { loadMcpEndpoints } from "./lib/mcp-endpoints.mjs";
import { probeHttpReachable } from "./lib/mcp-sse-probe.mjs";
import { ensureChromaBootstrap, isChromaReady, resolveChromaDir } from "./lib/chroma-bootstrap.mjs";
import {
  ensureToolchain,
  probePnpm,
  resolvePythonExecutable,
} from "./lib/toolchain-bootstrap.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sognaRoot = defaultSognaRoot;
const gitRoot = resolveGitRoot(sognaRoot);

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const fast = flags.has("--fast");
const full = flags.has("--full");
const noPull = flags.has("--no-pull");
const noInstall =
  flags.has("--no-install") || (fast && existsSync(path.join(sognaRoot, "node_modules")));
const doFetch = flags.has("--fetch");
const startServices = flags.has("--start-services");
const deployCorners = flags.has("--deploy-corners");
const jsonOut = flags.has("--json");
const autoRepairCorners = !flags.has("--no-deploy-corners");
const skipChroma = flags.has("--skip-chroma");
const reindexChroma = flags.has("--reindex-chroma");
const skipToolchain = flags.has("--skip-toolchain");
const autoStartServices = !flags.has("--no-start-services");

/** @type {{ phase: string; status: 'ok'|'warn'|'fail'; detail?: string }[]} */
const phases = [];
let blockers = 0;
let warnings = 0;

function phase(name, status, detail) {
  phases.push({ phase: name, status, detail });
  if (status === "fail") blockers += 1;
  if (status === "warn") warnings += 1;
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: opts.cwd ?? sognaRoot,
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env, ...opts.env },
    shell: false,
  });
}

function runPnpm(args) {
  if (process.platform === "win32") {
    return spawnSync("cmd.exe", ["/d", "/s", "/c", "pnpm", ...args], {
      cwd: sognaRoot,
      encoding: "utf8",
      windowsHide: true,
      shell: false,
    });
  }
  return spawnSync("pnpm", args, {
    cwd: sognaRoot,
    encoding: "utf8",
    windowsHide: true,
    shell: false,
  });
}

function runNode(scriptRel, extraArgs = [], opts = {}) {
  return run("node", [path.join(sognaRoot, scriptRel), ...extraArgs], opts);
}

function readPkgVersion() {
  try {
    const pkg = JSON.parse(readFileSync(path.join(sognaRoot, "package.json"), "utf8"));
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

function pythonCmd() {
  return resolvePythonExecutable(sognaRoot) ?? (process.platform === "win32" ? "python" : "python3");
}

function runToolchain() {
  if (skipToolchain) {
    phase("toolchain", "ok", "omitido (--skip-toolchain)");
    return;
  }
  const venvMissing = !existsSync(path.join(sognaRoot, ".venv"));
  const pnpmMissing = !probePnpm();
  if (fast && !venvMissing && !pnpmMissing) {
    phase("toolchain", "ok", "pnpm + .venv presentes (--fast)");
    return;
  }
  const result = ensureToolchain(sognaRoot);
  for (const step of result.steps ?? []) {
    phase(step.phase, step.ok ? "ok" : "fail", step.detail);
  }
  if (!result.ok) {
    phase("toolchain", "fail", result.detail ?? "toolchain incompleto");
    return;
  }
  phase("toolchain", "ok", "pnpm + Python UMA + .env listos");
}

function checkEnvironment() {
  const nodeV = process.version;
  const pnpmV = probePnpm();
  const nodeOk = parseInt(nodeV.slice(1), 10) >= 20;
  const pnpmOk = pnpmV && parseInt(pnpmV.split(".")[0], 10) >= 10;
  const layout = isEmbeddedLayout(sognaRoot) ? "embedded" : "monorepo";

  if (!nodeOk) phase("entorno", "fail", `Node ${nodeV} — requiere >=20`);
  else if (!pnpmOk) phase("entorno", "fail", `pnpm ${pnpmV ?? "?"} — requiere >=10`);
  else phase("entorno", "ok", `${process.platform} | Node ${nodeV} | pnpm ${pnpmV} | ${layout}`);

  return { nodeV, pnpmV, layout, nodeOk, pnpmOk };
}

function runInstall() {
  if (noInstall) {
    phase("deps", "ok", "omitido (--no-install)");
    return;
  }
  const need = needsPnpmInstall(sognaRoot);
  if (!need.needed) {
    phase("deps", "ok", need.reason);
    return;
  }
  const r = runPnpm(["install"]);
  if (r.status === 0) phase("deps", "ok", `pnpm install — ${need.reason}`);
  else {
    phase("deps", "fail", `pnpm install exit ${r.status ?? 1}`);
    if (r.stderr) process.stderr.write(r.stderr);
  }
}

function runPull() {
  if (noPull) {
    phase("pull", "ok", "omitido (--no-pull)");
    return;
  }
  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: gitRoot });
  const upstream = run("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], {
    cwd: gitRoot,
  });
  if (!upstream.ok || !upstream.stdout || upstream.stdout === "HEAD") {
    phase("pull", "warn", "sin upstream — omitido (¿primer clone sin rama remota?)");
    return;
  }
  const r = run("git", ["pull", "--ff-only"], { cwd: gitRoot });
  if (r.status === 0) {
    const msg = (r.stdout || r.stderr || "ok").split("\n").find((l) => l.trim()) || "actualizado";
    phase("pull", "ok", msg.trim());
  } else {
    phase("pull", "fail", "git pull --ff-only falló — resuelva conflictos manualmente");
    if (r.stderr) process.stderr.write(r.stderr);
  }
}

function runCorners() {
  if (deployCorners) {
    const d = runNode("scripts/deploy-corners.mjs");
    if (d.status !== 0) {
      phase("corners", "fail", "deploy-corners falló");
      return;
    }
  }
  let v = runNode("scripts/verify-corners.mjs");
  if (v.status !== 0 && autoRepairCorners && !deployCorners) {
    const d = runNode("scripts/deploy-corners.mjs");
    if (d.status === 0) v = runNode("scripts/verify-corners.mjs");
  }
  if (v.status === 0) phase("corners", "ok", "Capa 2 alineada");
  else {
    phase("corners", "fail", "drift — pnpm corners:deploy o --deploy-corners");
  }
}

async function checkServices() {
  const endpoints = loadMcpEndpoints(sognaRoot);
  const uma = await probeHttpReachable({ name: "UMA MCP", url: endpoints.mcp_uma_health_url });
  const bridge = await probeHttpReachable({ name: "Bridge", url: endpoints.mcp_bridge_health_url });
  const up = uma.ok && bridge.ok;

  if (up) {
    phase("servicios", "ok", `UMA :${endpoints.mcp_uma_port} + Bridge :${endpoints.mcp_bridge_port}`);
    return;
  }

  if (startServices || (autoStartServices && !fast)) {
    const on = run("node", [path.join(sognaRoot, "control", "sogna.mjs"), "on", "silent"]);
    if (on.status === 0) {
      await new Promise((r) => setTimeout(r, 3000));
      const uma2 = await probeHttpReachable({ name: "UMA MCP", url: endpoints.mcp_uma_health_url });
      const bridge2 = await probeHttpReachable({ name: "Bridge", url: endpoints.mcp_bridge_health_url });
      if (uma2.ok && bridge2.ok) {
        phase("servicios", "ok", "arrancados con sogna:on");
        return;
      }
    }
    phase("servicios", "warn", "sogna:on no levantó MCP a tiempo");
    return;
  }

  phase("servicios", "warn", "MCP local caído — pnpm sogna:on o --start-services");
}

function runChromaBootstrap() {
  if (skipChroma) {
    phase("chroma", "ok", "omitido (--skip-chroma)");
    return;
  }
  if (fast && !reindexChroma) {
    const check = isChromaReady(resolveChromaDir(sognaRoot));
    if (check.ready) phase("chroma", "ok", check.reason);
    else phase("chroma", "warn", `${check.reason} — pnpm chroma:index o sogna:dream sin --fast`);
    return;
  }
  const result = ensureChromaBootstrap(sognaRoot, { force: reindexChroma });
  if (result.ok) {
    const label = result.action === "skip" ? "presente" : result.action === "reindex" ? "reindexado" : "indexado";
    phase("chroma", "ok", `${label} — ${result.detail}`);
  } else {
    phase("chroma", "fail", result.detail);
  }
}

function runMcpDoctor() {
  if (fast) {
    const cfg = run(pythonCmd(), [path.join(sognaRoot, "Curator", "scripts", "auto_config_mcp.py")]);
    if (cfg.status === 0) phase("mcp", "ok", "mcp:config (--fast, sin health runtime)");
    else phase("mcp", "warn", "auto_config_mcp.py falló");
    return;
  }

  const r = runNode("scripts/mcp-doctor.mjs");
  if (r.status === 0) phase("mcp", "ok", "mcp:doctor OK");
  else phase("mcp", "fail", "mcp:doctor — pnpm sogna:on → pnpm mcp:doctor");
}

function checkSentinel() {
  const sigPath = path.join(sognaRoot, "Sentinel", "data", "signatures.json");
  if (!existsSync(sigPath)) {
    phase("sentinel", "warn", "signatures.json ausente — pnpm sentinel:resign");
    return;
  }
  try {
    const data = JSON.parse(readFileSync(sigPath, "utf8"));
    const count = Object.keys(data).length;
    if (count < 10) phase("sentinel", "warn", `solo ${count} firmas`);
    else phase("sentinel", "ok", `${count} firmas institucionales`);
  } catch {
    phase("sentinel", "warn", "signatures.json ilegible");
  }

  if (full) {
    const audit = run(pythonCmd(), [path.join(sognaRoot, "Sentinel", "Sentinel-doctor.py")]);
    if (audit.status === 0) phase("sentinel-audit", "ok", "sentinel:audit completo");
    else phase("sentinel-audit", "warn", "sentinel:audit con incidencias");
  }
}

function runAmplifier() {
  if (!full) return;
  const r = runNode("scripts/verify-mcp-amplifier.mjs");
  if (r.status === 0) phase("amplifier", "ok", "mcp:amplifier OK");
  else phase("amplifier", "warn", "mcp:amplifier con fallos");
}

function verdict() {
  if (blockers > 0) return "BLOQUEADO";
  if (warnings > 0) return "LISTO CON ATENCIÓN";
  return "LISTO PARA TRABAJAR";
}

async function main() {
  const started = new Date().toISOString();

  runToolchain();

  const envReport = checkEnv(sognaRoot);
  const catalog = collectSkillsCatalog(sognaRoot);
  const envInfo = checkEnvironment();

  runPull();
  const gitFp = collectGitFingerprint(gitRoot, { fetch: doFetch });
  runInstall();
  runCorners();
  runChromaBootstrap();

  if (!envReport.exampleExists) phase("env", "warn", ".env.example ausente");
  else if (!envReport.envExists) phase("env", "warn", ".env ausente (toolchain debería haberlo creado)");
  else if (envReport.missingRequired.length) phase("env", "fail", `faltan: ${envReport.missingRequired.join(", ")}`);
  else if (envReport.needsCloudKeys && !envReport.cloudKeysOk) phase("env", "warn", "modo cloud sin API keys");
  else if (envReport.missingRecommended.length)
    phase("env", "warn", `recomendadas ausentes: ${envReport.missingRecommended.join(", ")}`);
  else phase("env", "ok", `${envReport.setCount}/${envReport.documented} claves documentadas`);

  await checkServices();
  runMcpDoctor();
  phase(
    "catalogo",
    "ok",
    `${catalog.agents} agentes | ${catalog.skillsCurated} curated | ${catalog.skillsRuntime} runtime`,
  );
  checkSentinel();
  runAmplifier();

  const v = verdict();
  const banner = "═".repeat(50);

  console.log("");
  console.log(banner);
  console.log(" SOGNA DREAM — Bootstrap de sesión");
  console.log(banner);

  for (const line of formatGitSection(gitFp)) console.log(line);
  console.log("");
  console.log(" DISPOSITIVO");
  console.log(`   OS:       ${process.platform} ${process.arch}`);
  console.log(`   Node:     ${envInfo.nodeV} | pnpm ${envInfo.pnpmV ?? "?"}`);
  console.log(`   Layout:   ${envInfo.layout} | command_cwd=Sogna/`);
  console.log(`   Versión:  sogna@${readPkgVersion()}`);
  console.log("");

  for (const line of formatEnvSection(envReport)) console.log(line);
  console.log("");

  for (const p of phases) {
    const icon = p.status === "ok" ? "✓" : p.status === "warn" ? "⚠" : "✗";
    const label = p.phase.toUpperCase().padEnd(12);
    console.log(` ${label} ${icon} ${p.detail ?? p.status}`);
  }

  console.log("");
  for (const line of formatCatalogSection(catalog)) console.log(line);
  console.log("");
  console.log(` VEREDICTO: ${v}`);
  if (v !== "LISTO PARA TRABAJAR") {
    console.log(" Siguiente: corrija ✗ y ⚠ antes de trabajar; luego «Sogna dream» en Cursor");
  } else {
    console.log(" Siguiente: abra Cursor → «Sogna dream» en chat");
  }
  console.log(banner);
  console.log("");

  const report = {
    schema: "sogna-dream-report",
    version: 1,
    started,
    finished: new Date().toISOString(),
    sognaRoot,
    gitRoot,
    flags: [...flags],
    git: gitFp,
    device: {
      platform: process.platform,
      arch: process.arch,
      node: envInfo.nodeV,
      pnpm: envInfo.pnpmV,
      layout: envInfo.layout,
    },
    env: {
      envExists: envReport.envExists,
      setCount: envReport.setCount,
      documented: envReport.documented,
      missingRequired: envReport.missingRequired,
      missingRecommended: envReport.missingRecommended,
    },
    catalog,
    phases,
    verdict: v,
    blockers,
    warnings,
  };

  const logDir = path.join(sognaRoot, "memory", "operational", "logs");
  mkdirSync(logDir, { recursive: true });
  const reportPath = path.join(logDir, "dream_latest.json");
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (jsonOut) console.log(JSON.stringify(report, null, 2));
  else console.log(` Informe JSON: ${reportPath}`);

  process.exit(blockers > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[SOGNA DREAM]", err instanceof Error ? err.message : err);
  process.exit(1);
});
