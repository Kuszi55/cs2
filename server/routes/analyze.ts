import { Router, Request, Response, NextFunction } from "express";
import multer, { MulterError } from "multer";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import {
  DemoAnalyzer,
  isValidDemoFile,
  getDemoFileMetadata,
} from "../services/demoParser";
import { MatchService } from "../services/matchService";

const execFileAsync = promisify(execFile);
const router = Router();

// 🔹 Folder uploadów
const uploadsDir = path.join(process.cwd(), "dist/spa/uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// 🔹 Multer konfiguracja
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    console.log("File filter check:", file.originalname, "ext:", ext);
    if (ext !== ".dem") {
      console.error("❌ Rejected file:", file.originalname);
      return cb(new Error("Only .dem files are supported"));
    }
    cb(null, true);
  },
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
});

// 🔹 Funkcja upload + analiza
const uploadAndAnalyze = async (req: Request, res: Response) => {
  console.log("===== FILE UPLOAD REQUEST =====");
  console.log("Body:", req.body);
  console.log("File:", req.file);

  try {
    if (!req.file) {
      console.error("❌ No file detected in request!");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    console.log("Upload received:", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: filePath,
    });

    if (!isValidDemoFile(filePath)) {
      console.error("❌ Invalid demo file format:", filePath);
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(400).json({ error: "Invalid demo file format" });
    }

    const metadata = getDemoFileMetadata(filePath);
    console.log("File metadata:", metadata);

    let analysis: any;

    // 🔹 Próbujemy python3 → fallback JS
    try {
      const pythonScript = "/var/www/cs2-analysis/scripts/parse_demo.py";
      const { stdout, stderr } = await execFileAsync("python3", [pythonScript, filePath], {
        timeout: 120000,
        maxBuffer: 20 * 1024 * 1024,
      });

      if (stderr) console.warn("Python stderr:", stderr);
      console.log("Python stdout:", stdout.slice(0, 500));

      const pythonOutput = JSON.parse(stdout);
      if (!pythonOutput.success) throw new Error(pythonOutput.error || "Python script failed");

      // ⚡ Kluczowa zmiana: zawsze bierzemy analysis
      analysis = pythonOutput.analysis;
      console.log("✅ Python analysis success:", req.file.originalname);
    } catch (pyErr) {
      console.warn("⚠️ Python failed, fallback to JS:", pyErr);
      const analyzer = new DemoAnalyzer(filePath);
      analysis = await analyzer.analyze();
    }

    try {
      const savedMatch = MatchService.saveMatch({ demoFileName: req.file.originalname, ...analysis });
      console.log("✅ Saved match:", savedMatch.id);
      return res.json({ success: true, ...analysis, matchId: savedMatch.id, metadata });
    } catch (dbErr) {
      console.warn("⚠️ Failed to save match:", dbErr);
      return res.json({ success: true, metadata, analysis, warning: "Failed to save DB" });
    }
  } catch (err) {
    console.error("🔥 Upload/analysis error:", err);
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(500).json({ error: "Failed to analyze demo: " + (err as Error).message });
  }
};

// 🔹 Błąd z Multer
const multerErrorHandler = (err: any, _req: Request, res: Response, next: NextFunction) => {
  console.error("💥 Multer upload error:", err);
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File too large. Max 1GB." });
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// 🔹 Endpointy
router.post("/upload", upload.single("file"), multerErrorHandler, uploadAndAnalyze);
export default router;
