import path from "path";
import { createServer } from "./index";
import express from "express";
import multer from "multer";
import { execFile } from "child_process";
import fs from "fs/promises";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// --- Multer setup for uploads ---
const uploadDir = path.join(distPath, "uploads");
app.use(express.json());
await fs.mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });

// --- API endpoint for uploading DEM and analyzing ---
app.post("/api/upload", upload.single("demo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

  const demoPath = req.file.path;
  const parserPath = path.join(__dirname, "demoinfocs-golang/examples/cs2json"); // ścieżka do Go parsera

  try {
    execFile(parserPath, [demoPath], { encoding: "utf8" }, (err, stdout, stderr) => {
      if (err) {
        // Jeśli parser wypluje JSON, nawet z success:false, użyj go
        try {
          const parsed = JSON.parse(stdout.trim());
          return res.json(parsed);
        } catch {
          return res.json({ success: false, error: "Parser failed and returned invalid output" });
        }
      } else {
        try {
          const parsed = JSON.parse(stdout.trim());
          return res.json(parsed);
        } catch {
          return res.json({ success: false, error: "Parser returned invalid JSON" });
        }
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: "Failed to run parser" });
  }
});

// Handle React Router - serve index.html for all non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
