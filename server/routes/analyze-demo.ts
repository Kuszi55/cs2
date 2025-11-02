import { RequestHandler } from "express";
import multer from "multer";
import { DemoAnalysisResponse } from "@shared/api";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// Multer config (temp .dem upload)
const upload = multer({ dest: "/tmp" });

export const handleAnalyzeDemo: RequestHandler[] = [
  upload.single("demo"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const demoPath = req.file.path;
    const analyzerPath = path.resolve(
      __dirname,
      "../../../scripts/demoinfocs-golang/examples/cs2json"
    );

    // Wywołanie analizatora Go
    const proc = spawn(analyzerPath, [demoPath]);
    let data = "";
    let errData = "";

    proc.stdout.on("data", (chunk) => (data += chunk));
    proc.stderr.on("data", (chunk) => (errData += chunk));

    proc.on("close", (code) => {
      fs.unlinkSync(demoPath); // czyść po sobie!
      if (code !== 0) {
        return res.status(500).json({
          success: false,
          error: "Analyzer failed: " + errData,
        });
      }
      try {
        const parsed: DemoAnalysisResponse = JSON.parse(data);
        res.json(parsed);
      } catch (e) {
        res.status(500).json({
          success: false,
          error: "Failed to parse analyzer output: " + String(e),
        });
      }
    });
  },
];
