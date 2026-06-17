#!/usr/bin/env node
/**
 * Generación Ollama vía API HTTP local (sin `ollama run` CLI).
 * Timeouts efectivos en Windows; no deja procesos hijos colgados.
 */

/**
 * @returns {string}
 */
export function getOllamaBaseUrl() {
  const raw = process.env.SOGNA_OLLAMA_HOST || "http://127.0.0.1:11434";
  return raw.replace(/\/$/, "");
}

/**
 * @param {string} model
 * @param {string} prompt
 * @param {{ timeoutMs?: number; num_predict?: number }} [opts]
 * @returns {Promise<{ ok: boolean; output?: string; model: string; error?: string }>}
 */
export async function ollamaGenerate(model, prompt, opts = {}) {
  const timeoutMs = Math.max(
    3000,
    opts.timeoutMs ??
      (parseInt(process.env.SOGNA_OLLAMA_GENERATE_TIMEOUT_MS || "90000", 10) || 90000),
  );
  const url = `${getOllamaBaseUrl()}/api/generate`;

  /** @type {Response | null} */
  let res = null;
  try {
    res = await Promise.race([
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          ...(opts.num_predict != null
            ? { options: { num_predict: opts.num_predict } }
            : {}),
        }),
      }),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Ollama timeout tras ${timeoutMs}ms (modelo ${model})`)),
          timeoutMs,
        );
      }),
    ]);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama HTTP ${res.status}: ${text.slice(0, 240)}`);
    }

    const data = await res.json();
    const output = String(data.response ?? "").trim();
    if (!output && data.error) {
      throw new Error(String(data.error));
    }
    return { ok: true, output, model: String(data.model || model) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, model, error: msg };
  } finally {
    try {
      await res?.body?.cancel();
    } catch {
      // ignore
    }
  }
}
