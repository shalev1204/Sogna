#!/usr/bin/env node
/**
 * Comprueba que la pila MCP local de Sogna este escuchando.
 * Uso: node scripts/verify-mcp-health.mjs (desde sogna_root)
 */
const checks = [
  { name: "UMA API", url: "http://127.0.0.1:8080/health", required: true },
  { name: "MCP Sogna_UMA (SSE)", url: "http://127.0.0.1:8000/sse", required: true },
  { name: "MCP Sognatore Bridge (SSE)", url: "http://127.0.0.1:8001/sse", required: true },
];

async function probe({ name, url, required }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const ok = res.status >= 200 && res.status < 400;
    return { name, url, required, ok, status: res.status };
  } catch (err) {
    return {
      name,
      url,
      required,
      ok: false,
      status: null,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

const results = await Promise.all(checks.map(probe));
let failed = 0;

for (const r of results) {
  const tag = r.ok ? "OK" : r.required ? "FAIL" : "WARN";
  const detail = r.ok ? `HTTP ${r.status}` : r.error ?? "sin respuesta";
  console.log(`[${tag}] ${r.name} — ${r.url} (${detail})`);
  if (!r.ok && r.required) failed += 1;
}

if (failed > 0) {
  console.error(
    "\nServicios MCP locales caidos. Encienda: control\\Encender.bat (Windows) o equivalente.",
  );
  process.exit(1);
}

console.log("\nPila MCP local operativa. Reinicie MCP en Cursor si los clientes siguen en error.");
process.exit(0);
