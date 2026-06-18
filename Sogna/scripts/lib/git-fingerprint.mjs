#!/usr/bin/env node
/**
 * Huella Git de solo lectura para bootstrap sogna:dream.
 * No ejecuta pull, merge ni fetch salvo opt-in explícito (--fetch en el orquestador).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

/**
 * @param {string} gitRoot
 * @param {{ fetch?: boolean }} [opts]
 */
export function collectGitFingerprint(gitRoot, opts = {}) {
  /** @type {Record<string, string>} */
  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };

  if (opts.fetch) {
    spawnSync("git", ["fetch", "--quiet"], { cwd: gitRoot, encoding: "utf8", env, windowsHide: true });
  }

  const run = (args) => {
    const r = spawnSync("git", args, {
      cwd: gitRoot,
      encoding: "utf8",
      env,
      windowsHide: true,
    });
    return {
      ok: r.status === 0,
      stdout: (r.stdout || "").trim(),
      stderr: (r.stderr || "").trim(),
      status: r.status ?? 1,
    };
  };

  const isRepo = run(["rev-parse", "--git-dir"]);
  if (!isRepo.ok) {
    return {
      ok: false,
      error: "No es un repositorio Git",
      gitRoot,
    };
  }

  const branch = run(["rev-parse", "--abbrev-ref", "HEAD"]);
  const head = run(["rev-parse", "--short", "HEAD"]);
  const headFull = run(["rev-parse", "HEAD"]);
  const subject = run(["show", "-s", "--format=%s", "HEAD"]);
  const authorDate = run(["show", "-s", "--format=%ci", "HEAD"]);
  const upstream = run(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  const porcelain = run(["status", "--porcelain"]);
  const remote = run(["remote", "get-url", "origin"]);

  const dirtyLines = porcelain.ok && porcelain.stdout ? porcelain.stdout.split("\n").filter(Boolean) : [];
  const dirtyCount = dirtyLines.length;

  /** @type {{ ahead: number; behind: number; synced: boolean } | null} */
  let tracking = null;
  if (upstream.ok && upstream.stdout && upstream.stdout !== "HEAD") {
    const counts = run(["rev-list", "--left-right", "--count", `${upstream.stdout}...HEAD`]);
    if (counts.ok && counts.stdout) {
      const [behind, ahead] = counts.stdout.split(/\s+/).map((n) => parseInt(n, 10) || 0);
      tracking = {
        ahead,
        behind,
        synced: ahead === 0 && behind === 0,
      };
    }
  }

  const isoDate = authorDate.ok ? authorDate.stdout : null;
  let ageLabel = null;
  if (isoDate) {
    const ms = Date.now() - new Date(isoDate).getTime();
    const days = Math.floor(ms / 86_400_000);
    if (days === 0) ageLabel = "hoy";
    else if (days === 1) ageLabel = "ayer";
    else ageLabel = `hace ${days} días`;
  }

  return {
    ok: true,
    gitRoot,
    branch: branch.stdout || "unknown",
    commit: head.stdout || "unknown",
    commitFull: headFull.stdout || null,
    subject: subject.stdout || "",
    authorDate: isoDate,
    ageLabel,
    upstream: upstream.ok && upstream.stdout !== "HEAD" ? upstream.stdout : null,
    remote: remote.ok ? remote.stdout : null,
    dirtyCount,
    dirty: dirtyCount > 0,
    tracking,
    fetched: !!opts.fetch,
  };
}

/**
 * @param {ReturnType<typeof collectGitFingerprint>} fp
 */
export function formatGitSection(fp) {
  const lines = [];
  lines.push(" GIT");
  if (!fp.ok) {
    lines.push(`   Estado:   ✗ ${fp.error}`);
    return lines;
  }
  lines.push(`   Rama:     ${fp.branch}`);
  lines.push(`   Commit:   ${fp.commit} — "${fp.subject}"`);
  if (fp.authorDate) {
    lines.push(`   Fecha:    ${fp.authorDate}${fp.ageLabel ? ` (${fp.ageLabel})` : ""}`);
  }
  if (fp.remote) lines.push(`   Remote:   ${fp.remote}`);
  if (fp.upstream) {
    if (fp.tracking?.synced) {
      lines.push(`   Tracking: ${fp.upstream} — al día`);
    } else if (fp.tracking) {
      const parts = [];
      if (fp.tracking.ahead > 0) parts.push(`+${fp.tracking.ahead} local`);
      if (fp.tracking.behind > 0) parts.push(`-${fp.tracking.behind} vs remoto`);
      lines.push(`   Tracking: ${fp.upstream} — ${parts.join(", ") || "desalineado"}`);
    } else {
      lines.push(`   Tracking: ${fp.upstream}`);
    }
  } else {
    lines.push("   Tracking: sin upstream configurado");
  }
  if (fp.dirty) {
    lines.push(`   Working:  ⚠ ${fp.dirtyCount} archivo(s) sin commit`);
  } else {
    lines.push("   Working:  limpio");
  }
  if (fp.fetched) lines.push("   Fetch:    ejecutado (solo comparación, sin pull)");
  return lines;
}

/**
 * @param {string} sognaRoot
 * @returns {string}
 */
export function resolveGitRoot(sognaRoot) {
  const embedded =
    sognaRoot.endsWith(`${path.sep}Sogna`) &&
    spawnSync("git", ["rev-parse", "--git-dir"], {
      cwd: path.dirname(sognaRoot),
      encoding: "utf8",
      windowsHide: true,
    }).status === 0;

  if (embedded) return path.dirname(sognaRoot);
  return sognaRoot;
}
