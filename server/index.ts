import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import analyzeRouter from "./routes/analyze";
import matchesRouter from "./routes/matches";
import { handleAnalyzeDemo } from "./routes/analyze-demo"; // ⬅️ nowy import

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ extended: true, limit: "500mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ⬇️ Nowy endpoint POST
  app.post("/api/analyze-demo", handleAnalyzeDemo);

  // Demo analysis routes
  app.use("/api/analyze", analyzeRouter);

  // Matches routes
  app.use("/api/matches", matchesRouter);

  return app;
}
