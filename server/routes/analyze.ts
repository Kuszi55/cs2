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

// Uploads directory
const uploadsDir = path.join(process.cwd(), "dist/spa/uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Multer upload config
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(ext === ".dem", ext === ".dem" ? null : new Error("Only .dem files are supported"));
  },
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
});

// Transform Go/Python output to unified format
function transformOutput(data: any) {
  return {
    mapName: data.map || "Unknown",
    gameMode: data.gameMode || "5v5",
    duration: data.duration || 0,
    teamAName: data.teamAName || "Team A",
    teamBName: data.teamBName || "Team B",
    teamAScore: data.score?.team_a || data.teamAScore || 0,
    teamBScore: data.score?.team_b || data.teamBScore || 0,
    players: data.players || [],
    fraudAssessments: data.fraudAssessments || [],
    totalEventsProcessed: data.events?.length || 0,
  };
}

// Upload & analyze
const uploadAndAnalyze = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    console.log("Upload received:", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: filePath,
    });

    if (!isValidDemoFile(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(400).json({ error: "Invalid demo file format" });
    }

    const metadata = getDemoFileMetadata(filePath);
    console.log("File metadata:", metadata);

    let analysis: any;

    // Try Python first
    try {
      const pythonScript = "/var/www/cs2-analysis/scripts/parse_demo.py";
      const { stdout, stderr } = await execFileAsync("python3", [pythonScript, filePath], {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      });

      if (stderr) console.warn("Python script stderr:", stderr);

      const pythonOutput = JSON.parse(stdout);
      if (!pythonOutput.success) throw new Error(pythonOutput.error || "Python script failed");

      analysis = transformOutput(pythonOutput);
      console.log("Python analysis successful for:", req.file.originalname);
    } catch (pyErr) {
      console.warn("Python failed, using Go parser:", pyErr);

      try {
        const goParser = "/var/www/cs2-analysis/scripts/cs2json";
        const { stdout, stderr } = await execFileAsync(goParser, [filePath], {
          timeout: 60000,
          maxBuffer: 10 * 1024 * 1024,
        });

        if (stderr) console.warn("Go parser stderr:", stderr);

        const goOutput = JSON.parse(stdout);
        if (!goOutput.success) throw new Error(goOutput.error || "Go parser failed");

        analysis = transformOutput(goOutput);
        console.log("Go parser analysis successful for:", req.file.originalname);
      } catch (goErr) {
        console.error("Go parser failed too:", goErr);
        // Fallback JS analyzer as last resort
        const analyzer = new DemoAnalyzer(filePath);
        analysis = await analyzer.analyze();
        console.log("Fallback JS analyzer used for:", req.file.originalname);
      }
    }

    // Save match
    try {
      const savedMatch = MatchService.saveMatch({ demoFileName: req.file.originalname, ...analysis });
      return res.json({ success: true, matchId: savedMatch.id, metadata, analysis, uploadedFilePath: req.file.filename });
    } catch (dbErr) {
      console.warn("Failed to save match:", dbErr);
      return res.json({ success: true, metadata, analysis, uploadedFilePath: req.file.filename, warning: "Failed to save to DB" });
    }
  } catch (err) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    console.error("Upload/analysis error:", err);
    return res.status(500).json({ error: "Failed to analyze demo file: " + (err as Error).message });
  }
};

// Multer error handler
const multerErrorHandler = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof MulterError) {
    console.error("Multer error:", err);
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File too large. Max 1GB." });
    return res.status(400).json({ error: err.message });
  } else if (err) {
    console.error("Upload error:", err);
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Analyze existing demo file
const analyzeDemo = async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: "No file path provided" });

    const fullPath = path.join(uploadsDir, filePath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: "File not found" });
    if (!isValidDemoFile(fullPath)) return res.status(400).json({ error: "Invalid demo file format" });

    const analyzer = new DemoAnalyzer(fullPath);
    const analysis = await analyzer.analyze();
    return res.json({ success: true, analysis });
  } catch (err) {
    console.error("Analysis error:", err);
    return res.status(500).json({ error: "Failed to analyze demo: " + (err as Error).message });
  }
};

// Status route
const getAnalysisStatus = async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(uploadsDir, fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });

    return res.json({ status: "completed", progress: 100, fileName, completedAt: new Date() });
  } catch (err) {
    return res.status(500).json({ error: "Failed to get status: " + (err as Error).message });
  }
};

// Routes
router.post("/upload", upload.single("file"), multerErrorHandler, uploadAndAnalyze);
router.post("/", analyzeDemo);
router.get("/status/:fileName", getAnalysisStatus);

export default router;
