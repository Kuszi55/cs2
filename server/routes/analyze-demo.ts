import { RequestHandler } from "express";
import { spawn } from "child_process";
import { DemoAnalysisResponse } from "@shared/api";
import path from "path";
import fs from "fs";

export const handleAnalyzeDemo: RequestHandler = (req, res) => {
  const demoFile = req.file; // Zakładamy upload za pomocą multer
  if (!demoFile) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  const scriptPath = path.resolve(__dirname, "../../scripts/parse_demo.py");
  const python = spawn("python3", [scriptPath, demoFile.path]);

  let scriptOutput = "";
  let scriptError = "";

  python.stdout.on("data", (data) => {
    scriptOutput += data.toString();
  });

  python.stderr.on("data", (data) => {
    scriptError += data.toString();
  });

  python.on("close", (code) => {
    fs.unlinkSync(demoFile.path); // Usuwamy plik tymczasowy po analizie

    if (code !== 0) {
      return res.status(500).json({ success: false, error: scriptError || "Analysis failed" });
    }

    try {
      const parsed: DemoAnalysisResponse = JSON.parse(scriptOutput);
      res.json(parsed);
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to parse Python output" });
    }
  });
};
