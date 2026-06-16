#!/usr/bin/env node
/**
 * SSOT: modo de inteligencia Sognatore (local / hybrid / cloud).
 * Sin dependencias de build; consumido por MCP-Bridge y BootstrapEngine.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * @param {string} sognaRoot - Raíz operativa (contiene memory/identity/sogna.md)
 */
export function loadIntelligenceConfig(sognaRoot) {
  const sognarcPath = path.join(sognaRoot, ".sognarc.json");
  let intelligence = {
    mode: "local",
    local_provider: "ollama",
    cloud_provider: null,
    worker_profile: "background",
    routing_rules: {},
  };

  if (existsSync(sognarcPath)) {
    try {
      const raw = JSON.parse(readFileSync(sognarcPath, "utf8"));
      if (raw.intelligence && typeof raw.intelligence === "object") {
        intelligence = { ...intelligence, ...raw.intelligence };
      }
    } catch {
      // fallback defaults
    }
  }

  const localMode =
    process.env.SOGNA_LOCAL_MODE === "true" ||
    intelligence.mode === "local" ||
    process.env.SOGNATORE_KEYLESS === "true";

  const keyless =
    process.env.SOGNATORE_KEYLESS === "true" ||
    intelligence.mode === "local" ||
    localMode;

  const allowCloud =
    process.env.SOGNATORE_ALLOW_CLOUD === "true" ||
    intelligence.mode === "hybrid" ||
    intelligence.mode === "cloud";

  return {
    intelligence,
    localMode,
    keyless,
    allowCloud,
    defaultProvider: localMode ? "ollama" : intelligence.cloud_provider || "gemini",
  };
}

export function hasCloudApiKeys() {
  return !!(
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

/**
 * @param {string} sognaRoot
 * @returns {Promise<{ ok: boolean; message: string }>}
 */
export async function verifyLocalProvider(sognaRoot) {
  const cfg = loadIntelligenceConfig(sognaRoot);
  if (!cfg.localMode && !cfg.keyless) {
    return { ok: true, message: "Cloud mode — local provider not required." };
  }

  try {
    const { spawn } = await import("node:child_process");
    const result = await new Promise((resolve) => {
      const child = spawn("ollama", ["--version"], {
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let out = "";
      child.stdout?.on("data", (d) => {
        out += d.toString();
      });
      child.on("close", (code) => resolve({ code, out }));
      child.on("error", () => resolve({ code: 1, out: "" }));
    });
    if (result.code === 0) {
      return {
        ok: true,
        message: `Ollama disponible (${result.out.trim() || "ok"}). Modo: ${cfg.intelligence.mode}.`,
      };
    }
    return {
      ok: false,
      message:
        "Modo local/keyless activo pero Ollama no responde. Instale Ollama o defina SOGNATORE_ALLOW_CLOUD=true con API keys.",
    };
  } catch (e) {
    return {
      ok: false,
      message: `Error comprobando Ollama: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
