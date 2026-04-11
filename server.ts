import "dotenv/config";
import express, { type Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import {
  AIServiceError,
  analyzeDocument,
  generateActionPlan,
  parseDocumentAnalyzeRequest,
  parsePlanRequest,
} from "./src/server/aiService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  const handleApiError = (res: Response, error: unknown) => {
    if (error instanceof AIServiceError) {
      res.status(error.statusCode).json({ ok: false, error: error.clientMessage });
      return;
    }

    console.error("Unhandled API error:", error);
    res.status(500).json({ ok: false, error: "Unexpected server error." });
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai/plan", async (req, res) => {
    try {
      const payload = parsePlanRequest(req.body);
      const plan = await generateActionPlan(payload.input, payload.context);
      res.json({ ok: true, plan });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.post("/api/documents/analyze", async (req, res) => {
    try {
      const payload = parseDocumentAnalyzeRequest(req.body);
      const analysis = await analyzeDocument(payload);
      res.json({ ok: true, analysis });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
