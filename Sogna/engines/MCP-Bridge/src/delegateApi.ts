import type { Express, Request, Response } from "express";
import {
  loadSognatoreMcpLibs,
  handleAmplifierTool,
} from "./sognatoreMcp.js";

export function mountDelegateApi(app: Express, sognaRoot: string): void {
  app.get("/api/agents", async (_req: Request, res: Response) => {
    try {
      const libs = await loadSognatoreMcpLibs(sognaRoot);
      res.json({ count: libs.listAgents(sognaRoot).length, agents: libs.listAgents(sognaRoot) });
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.get("/api/context", async (_req: Request, res: Response) => {
    try {
      const result = await handleAmplifierTool(sognaRoot, "get_project_context", {});
      res.type("application/json").send(result.text);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/api/route", async (req: Request, res: Response) => {
    try {
      const task = String(req.body?.task || "");
      if (!task) {
        res.status(400).json({ error: "task requerido" });
        return;
      }
      const result = await handleAmplifierTool(sognaRoot, "route_task", { task });
      res.type("application/json").send(result.text);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/api/brief", async (req: Request, res: Response) => {
    try {
      const task = String(req.body?.task || "");
      const agentId = req.body?.agent_id ? String(req.body.agent_id) : undefined;
      const query = req.body?.query ? String(req.body.query) : undefined;

      const { pathToFileURL } = await import("url");
      const path = await import("path");
      const briefPath = path.join(sognaRoot, "scripts", "lib", "dispatch-brief.mjs");
      const briefMod = await import(pathToFileURL(briefPath).href);

      let umaRecall: string | undefined;
      if (query) {
        try {
          const umaRes = await fetch("http://127.0.0.1:8080/memory/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, n_results: 3 }),
            signal: AbortSignal.timeout(5000),
          });
          if (umaRes.ok) {
            const data = (await umaRes.json()) as { raw_output?: string };
            umaRecall = data.raw_output;
          }
        } catch {
          // UMA opcional
        }
      }

      const brief = briefMod.buildDispatchBrief(sognaRoot, {
        task: task || query,
        agentId,
        query,
        umaRecall,
      });
      res.json(brief);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.get("/api/worker/scripts", async (_req: Request, res: Response) => {
    try {
      const libs = await loadSognatoreMcpLibs(sognaRoot);
      res.json({ scripts: Object.keys(libs.SCRIPT_REGISTRY) });
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.get("/api/worker/jobs", async (_req: Request, res: Response) => {
    try {
      const result = await handleAmplifierTool(sognaRoot, "list_worker_jobs", {});
      res.type("application/json").send(result.text);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.get("/api/worker/jobs/:id", async (req: Request, res: Response) => {
    try {
      const result = await handleAmplifierTool(sognaRoot, "get_worker_job_status", {
        job_id: req.params.id,
      });
      if (result.isError) {
        res.status(404).type("application/json").send(result.text);
        return;
      }
      res.type("application/json").send(result.text);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/api/worker/enqueue", async (req: Request, res: Response) => {
    try {
      const kind = req.body?.kind as string;
      if (kind !== "script" && kind !== "ollama") {
        res.status(400).json({ error: "kind debe ser script u ollama" });
        return;
      }
      const result = await handleAmplifierTool(sognaRoot, "enqueue_worker_job", {
        kind,
        action: req.body?.action,
        task: req.body?.task,
        tier: req.body?.tier,
      });
      res.type("application/json").send(result.text);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.get("/api/playbook/:agentId", async (req: Request, res: Response) => {
    try {
      const result = await handleAmplifierTool(sognaRoot, "get_agent_playbook", {
        agent_id: req.params.agentId,
      });
      res.type("application/json").send(result.text);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });
}
