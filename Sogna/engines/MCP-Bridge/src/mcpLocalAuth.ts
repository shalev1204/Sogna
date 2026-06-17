import type { Request, Response } from "express";

/**
 * Token opcional para transporte MCP (SSE /message / streamable POST /sse).
 * Si SOGNA_MCP_TOKEN no está definido, no se exige auth (modo local IDE).
 */
export function getMcpToken(): string | undefined {
  const token = process.env.SOGNA_MCP_TOKEN?.trim();
  return token || undefined;
}

export function isMcpAuthEnabled(): boolean {
  return Boolean(getMcpToken());
}

export function verifyMcpToken(req: Request): boolean {
  const expected = getMcpToken();
  if (!expected) return true;

  const header = req.headers.authorization;
  if (header === `Bearer ${expected}`) return true;

  const queryToken = req.query.token;
  if (typeof queryToken === "string" && queryToken === expected) return true;

  return false;
}

export function rejectMcpUnauthorized(res: Response): void {
  if (res.headersSent) return;
  res.status(401).json({
    error:
      "Unauthorized MCP — configure SOGNA_MCP_TOKEN en el servidor y token en la URL del cliente (?token=) o Authorization: Bearer",
  });
}

export function requireMcpToken(req: Request, res: Response): boolean {
  if (verifyMcpToken(req)) return true;
  rejectMcpUnauthorized(res);
  return false;
}
