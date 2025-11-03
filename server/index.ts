import "dotenv/config";
import express from "express";
import cors from "cors";
import * as path from "path";
import { handleDemo } from "./routes/demo";
import analyzeRouter from "./routes/analyze";
import matchesRouter from "./routes/matches";
import clipsRouter from "./routes/clips";
import { handleAnalyzeDemo } from "./routes/analyze-demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ extended: true, limit: "500mb" }));

  // Static files for clips
  app.use("/clips", express.static(path.join(process.cwd(), "dist/spa/clips")));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Analyze demo
  app.post("/api/analyze-demo", handleAnalyzeDemo);

  // Demo analysis routes
  app.use("/api/analyze", analyzeRouter);

  // Matches routes
  app.use("/api/matches", matchesRouter);

  // Clips routes
  app.use("/api/clips", clipsRouter);

  return app;
}
