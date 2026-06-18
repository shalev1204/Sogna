#!/usr/bin/env node
/**
 * Bootstrap toolchain local: pnpm (corepack), venv Python, pip UMA, .env desde plantilla.
 */
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PNPM_VERSION = "10.33.0";

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string; inherit?: boolean }} [opts]
 */
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: opts.cwd,
    encoding: "utf8",
    windowsHide: true,
    shell: false,
    stdio: opts.inherit ? "inherit" : "pipe",
  });
}

/**
 * @param {string} cmd
 */
function which(cmd) {
  const r =
    process.platform === "win32"
      ? run("where", [cmd])
      : run("which", [cmd]);
  if (r.status !== 0) return null;
  return (r.stdout || "").split("\n")[0]?.trim() || null;
}

export function probePnpm() {
  const r =
    process.platform === "win32"
      ? run("cmd.exe", ["/d", "/s", "/c", "pnpm", "--version"])
      : run("pnpm", ["--version"]);
  if (r.status !== 0) return null;
  return (r.stdout || "").trim();
}

/**
 * @param {string} sognaRoot
 */
export function ensurePnpm(sognaRoot) {
  const existing = probePnpm();
  if (existing && parseInt(existing.split(".")[0], 10) >= 10) {
    return { ok: true, version: existing, action: "present" };
  }

  run("corepack", ["enable"], { inherit: true });

  let targetVersion = PNPM_VERSION;
  try {
    const pkg = JSON.parse(readFileSync(path.join(sognaRoot, "package.json"), "utf8"));
    const pm = String(pkg.packageManager || "");
    const m = pm.match(/pnpm@(.+)/);
    if (m) targetVersion = m[1];
  } catch {
    /* default */
  }

  const prep = run("corepack", ["prepare", `pnpm@${targetVersion}`, "--activate"], { inherit: true });
  let version = probePnpm();
  if (version) {
    return { ok: true, version, action: prep.status === 0 ? "corepack" : "corepack-partial" };
  }

  const npm = which("npm");
  if (npm) {
    run("npm", ["install", "-g", `pnpm@${targetVersion}`], { inherit: true });
    version = probePnpm();
    if (version) return { ok: true, version, action: "npm-global" };
  }

  return {
    ok: false,
    action: "fail",
    detail: "pnpm no disponible — corepack/npm falló",
  };
}

/**
 * @param {string} sognaRoot
 */
export function resolvePythonExecutable(sognaRoot) {
  const isWin = process.platform === "win32";
  const venvCandidates = isWin
    ? [path.join(sognaRoot, ".venv", "Scripts", "python.exe")]
    : [
        path.join(sognaRoot, ".venv", "bin", "python3"),
        path.join(sognaRoot, ".venv", "bin", "python"),
      ];
  for (const candidate of venvCandidates) {
    if (existsSync(candidate)) return candidate;
  }
  for (const cmd of isWin ? ["python", "py"] : ["python3", "python"]) {
    if (which(cmd)) return cmd;
  }
  return null;
}

/**
 * @param {string} python
 */
function pipOk(python) {
  const r = run(python, ["-m", "pip", "--version"]);
  return r.status === 0;
}

/**
 * @param {string} python
 */
function chromadbOk(python) {
  const r = run(python, ["-c", "import chromadb; import fastapi; import mcp"]);
  return r.status === 0;
}

/**
 * @param {string} sognaRoot
 */
export function ensurePythonUma(sognaRoot) {
  const requirements = path.join(sognaRoot, "requirements-uma.txt");
  if (!existsSync(requirements)) {
    return { ok: false, action: "fail", detail: "requirements-uma.txt ausente" };
  }

  let python = resolvePythonExecutable(sognaRoot);
  const venvDir = path.join(sognaRoot, ".venv");
  const isWin = process.platform === "win32";
  const venvPython = isWin
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python3");

  if (!existsSync(venvDir)) {
    const sysPython = python ?? (isWin ? "python" : "python3");
    const created = run(sysPython, ["-m", "venv", venvDir], { cwd: sognaRoot, inherit: true });
    if (created.status !== 0) {
      return {
        ok: false,
        action: "fail",
        detail: `no se pudo crear .venv — instale Python 3 (${isWin ? "python.org" : "brew install python@3.12"})`,
      };
    }
  }

  python = existsSync(venvPython) ? venvPython : resolvePythonExecutable(sognaRoot);
  if (!python) {
    return { ok: false, action: "fail", detail: "Python no encontrado" };
  }

  if (!pipOk(python)) {
    run(python, ["-m", "ensurepip", "--upgrade"], { inherit: true });
  }

  if (!chromadbOk(python)) {
    const pip = run(python, ["-m", "pip", "install", "-r", requirements], {
      cwd: sognaRoot,
      inherit: true,
    });
    if (pip.status !== 0) {
      return { ok: false, action: "fail", detail: "pip install requirements-uma.txt falló" };
    }
  }

  if (!chromadbOk(python)) {
    return { ok: false, action: "fail", detail: "dependencias UMA no importables tras pip install" };
  }

  return {
    ok: true,
    action: existsSync(venvDir) ? "venv+pip" : "pip",
    detail: python.includes(".venv") ? ".venv listo" : "python sistema",
    python,
  };
}

/**
 * @param {string} sognaRoot
 */
export function ensureEnvFromExample(sognaRoot) {
  const env = path.join(sognaRoot, ".env");
  const example = path.join(sognaRoot, ".env.example");
  if (existsSync(env)) return { ok: true, action: "present" };
  if (!existsSync(example)) return { ok: true, action: "skip", detail: "sin .env.example" };
  copyFileSync(example, env);
  return { ok: true, action: "created", detail: ".env desde .env.example" };
}

/**
 * Intenta instalar Node/Python vía Homebrew (solo macOS, opt-in implícito dream).
 */
export function tryBrewOsDeps() {
  if (process.platform !== "darwin") return { ok: false, action: "skip" };
  if (which("node") && which("python3")) return { ok: true, action: "present" };
  const brew = which("brew");
  if (!brew) {
    return {
      ok: false,
      action: "fail",
      detail: "Instale Homebrew (https://brew.sh) y ejecute: brew install node@20 python@3.12",
    };
  }
  const steps = [];
  if (!which("node")) {
    const r = run("brew", ["install", "node@20"], { inherit: true });
    steps.push(r.status === 0 ? "node@20" : "node@20-fail");
  }
  if (!which("python3")) {
    const r = run("brew", ["install", "python@3.12"], { inherit: true });
    steps.push(r.status === 0 ? "python@3.12" : "python@3.12-fail");
  }
  return { ok: !!(which("node") && which("python3")), action: "brew", detail: steps.join(", ") };
}

/**
 * @param {string} sognaRoot
 * @param {{ skipOs?: boolean }} [opts]
 */
export function ensureToolchain(sognaRoot, opts = {}) {
  /** @type {{ phase: string; ok: boolean; detail: string }[]} */
  const steps = [];

  const nodeMajor = parseInt(process.version.slice(1), 10);
  if (nodeMajor < 20) {
    if (!opts.skipOs && process.platform === "darwin") {
      const brew = tryBrewOsDeps();
      steps.push({ phase: "brew", ok: brew.ok, detail: brew.detail || brew.action });
    }
    if (parseInt(process.version.slice(1), 10) < 20) {
      return {
        ok: false,
        steps,
        detail: `Node ${process.version} — requiere >=20 (brew install node@20)`,
      };
    }
  }

  if (!which("python3") && !which("python") && process.platform === "darwin" && !opts.skipOs) {
    const brew = tryBrewOsDeps();
    steps.push({ phase: "brew-python", ok: brew.ok, detail: brew.detail || brew.action });
  }

  const pnpm = ensurePnpm(sognaRoot);
  steps.push({
    phase: "pnpm",
    ok: pnpm.ok,
    detail: pnpm.ok ? `${pnpm.action} → pnpm ${pnpm.version}` : pnpm.detail || "fallo",
  });
  if (!pnpm.ok) return { ok: false, steps, detail: pnpm.detail };

  const py = ensurePythonUma(sognaRoot);
  steps.push({ phase: "python", ok: py.ok, detail: py.ok ? py.detail : py.detail || "fallo" });
  if (!py.ok) return { ok: false, steps, detail: py.detail };

  const env = ensureEnvFromExample(sognaRoot);
  steps.push({
    phase: "env",
    ok: env.ok,
    detail: env.detail || env.action,
  });

  return { ok: true, steps, python: py.python, pnpmVersion: pnpm.version };
}
