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
      const task = req.body?.task ? String(req.body.task) : undefined;
      const agentId = req.body?.agent_id ? String(req.body.agent_id) : undefined;
      const query = req.body?.query ? String(req.body.query) : undefined;

      const result = await handleAmplifierTool(sognaRoot, "build_dispatch_brief", {
        task,
        agent_id: agentId,
        query,
      });
      if (result.isError) {
        res.status(400).type("application/json").send(result.text);
        return;
      }
      res.type("application/json").send(result.text);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/api/dept/resolve", async (req: Request, res: Response) => {
    try {
      const agentId = req.body?.agent_id ? String(req.body.agent_id) : "";
      const task = String(req.body?.task || "");
      if (!agentId || !task) {
        res.status(400).json({ error: "agent_id y task requeridos" });
        return;
      }
      const result = await handleAmplifierTool(sognaRoot, "resolve_dept_agent", {
        agent_id: agentId,
        task,
      });
      res.type("application/json").send(result.text);
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
      if (kind !== "script" && kind !== "ollama" && kind !== "dept") {
        res.status(400).json({ error: "kind debe ser script, ollama o dept" });
        return;
      }
      const result = await handleAmplifierTool(sognaRoot, "enqueue_worker_job", {
        kind,
        action: req.body?.action,
        task: req.body?.task,
        agent_id: req.body?.agent_id,
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
