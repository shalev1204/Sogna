import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

export type McpServerFactory = (sessionId?: string) => Server;

interface StreamableSession {
  transport: StreamableHTTPServerTransport;
  server: Server;
  lastActive: number;
}

const streamableSessions = new Map<string, StreamableSession>();

export function getStreamableSessionCount(): number {
  return streamableSessions.size;
}

/**
 * POST /sse — Streamable HTTP (mcp-remote http-first).
 */
export function createStreamablePostHandler(createServer: McpServerFactory) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionHeader = req.headers["mcp-session-id"];
      const sessionId = typeof sessionHeader === "string" ? sessionHeader : undefined;

      if (sessionId && streamableSessions.has(sessionId)) {
        const session = streamableSessions.get(sessionId)!;
        session.lastActive = Date.now();
        await session.transport.handleRequest(req, res, req.body);
        return;
      }

      if (!sessionId && isInitializeRequest(req.body)) {
        const server = createServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (sid) => {
            streamableSessions.set(sid, {
              transport,
              server,
              lastActive: Date.now(),
            });
          },
        });

        await server.connect(transport);

        transport.onclose = async () => {
          const sid = transport.sessionId;
          if (sid) streamableSessions.delete(sid);
          try {
            await server.close();
          } catch {
            // ignore
          }
        };

        await transport.handleRequest(req, res, req.body);
        return;
      }

      if (!res.headersSent) {
        res.status(400).json({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Bad Request: invalid streamable session" },
          id: null,
        });
      }
    } catch (error) {
      console.error("Sognatore: Streamable HTTP POST /sse error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  };
}

/**
 * GET /sse con header mcp-session-id — stream SSE del transporte Streamable HTTP.
 * @returns true si la petición fue atendida
 */
export async function tryHandleStreamableGet(req: Request, res: Response): Promise<boolean> {
  const sessionHeader = req.headers["mcp-session-id"];
  const sessionId = typeof sessionHeader === "string" ? sessionHeader : undefined;
  if (!sessionId || !streamableSessions.has(sessionId)) {
    return false;
  }
  const session = streamableSessions.get(sessionId)!;
  session.lastActive = Date.now();
  await session.transport.handleRequest(req, res);
  return true;
}

/**
 * Limpia sesiones streamable inactivas.
 */
export async function cleanupStreamableSessions(idleTimeoutMs: number): Promise<number> {
  const now = Date.now();
  let removed = 0;
  for (const [sessionId, session] of streamableSessions.entries()) {
    if (now - session.lastActive <= idleTimeoutMs) continue;
    streamableSessions.delete(sessionId);
    removed += 1;
    try {
      await session.transport.close();
    } catch {
      // ignore
    }
    try {
      await session.server.close();
    } catch {
      // ignore
    }
  }
  return removed;
}
