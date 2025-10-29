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

// Configure uploads directory
const uploadsDir = path.join(process.cwd(), "dist/spa/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

// Upload & analyze handler
const uploadAndAnalyze = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
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
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(400).json({ error: "Invalid demo file format" });
    }

    const metadata = getDemoFileMetadata(filePath);
    console.log("File metadata:", metadata);

    let analysis: any;

    try {
      const pythonScriptPath = "/var/www/cs2-analysis/scripts/parse_demo.py";
      const { stdout, stderr } = await execFileAsync("python3", [pythonScriptPath, filePath], {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      });

      if (stderr) console.warn("Python script stderr:", stderr);

      const pythonOutput = JSON.parse(stdout);
      if (!pythonOutput.success) throw new Error(pythonOutput.error || "Python script failed");

      analysis = transformPythonOutput(pythonOutput);
      console.log("Python script analysis successful for:", req.file.originalname);
    } catch (err) {
      console.warn("Python script failed, using JS fallback:", err);
      const analyzer = new DemoAnalyzer(filePath);
      analysis = await analyzer.analyze();
    }

    try {
      const savedMatch = MatchService.saveMatch({ demoFileName: req.file.originalname, ...analysis });
      return res.json({ success: true, matchId: savedMatch.id, metadata, analysis, uploadedFilePath: req.file.filename });
    } catch (dbError) {
      console.warn("Failed to save match:", dbError);
      return res.json({ success: true, metadata, analysis, uploadedFilePath: req.file.filename, warning: "Failed to save to DB" });
    }
  } catch (err) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    console.error("Upload/analysis error:", err);
    return res.status(500).json({ error: "Failed to analyze demo file: " + (err as Error).message });
  }
};

// Transform Python output
function transformPythonOutput(pythonData: any) {
  return {
    mapName: pythonData.map || "Unknown",
    gameMode: pythonData.gameMode || "5v5",
    duration: pythonData.duration || 0,
    teamAName: pythonData.teamAName || "Team A",
    teamBName: pythonData.teamBName || "Team B",
    teamAScore: pythonData.score?.team_a || pythonData.teamAScore || 0,
    teamBScore: pythonData.score?.team_b || pythonData.teamBScore || 0,
    players: pythonData.players || [],
    fraudAssessments: pythonData.fraudAssessments || [],
    totalEventsProcessed: pythonData.events?.length || 0,
  };
}

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

// Analysis status
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
