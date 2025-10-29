import { Router, Request, Response } from "express";
import multer from "multer";
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

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "dist/spa/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".dem") {
      return cb(null, false); // multer nie traktuje jako fatal error
    }
    cb(null, true);
  },
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
});

/**
 * POST /api/analyze/upload
 * Upload and analyze a demo file using Python script on VPS
 */
const uploadAndAnalyze = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded or invalid file type" });
    }

    const filePath = req.file.path;
    console.log("Upload received:", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: filePath,
    });

    if (!isValidDemoFile(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: "Invalid demo file format. Please upload a valid CS2 demo file.",
      });
    }

    const metadata = getDemoFileMetadata(filePath);
    console.log("File metadata:", metadata);

    let analysis: any;
    try {
      const pythonScriptPath = "/var/www/cs2-analysis/scripts/parse_demo.py";
      console.log("Executing Python script:", pythonScriptPath, "with file:", filePath);

      const { stdout, stderr } = await execFileAsync(
        "python3",
        [pythonScriptPath, filePath],
        { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
      );

      if (stderr) console.warn("Python script stderr:", stderr);

      try {
        const pythonOutput = JSON.parse(stdout);
        if (!pythonOutput.success) {
          throw new Error(pythonOutput.error || "Python script failed");
        }
        analysis = transformPythonOutput(pythonOutput);
        console.log("Python script analysis successful for:", req.file.originalname);
      } catch (parseError) {
        console.error("Failed to parse Python script output:", parseError);
        throw new Error("Invalid output from Python script");
      }
    } catch (pythonError) {
      console.warn("Python script execution failed, falling back to DemoAnalyzer:", pythonError);
      const analyzer = new DemoAnalyzer(filePath);
      analysis = await analyzer.analyze();
      console.log("Using fallback DemoAnalyzer for:", req.file.originalname);
    }

    try {
      const savedMatch = MatchService.saveMatch({
        demoFileName: req.file.originalname,
        ...analysis,
      });

      return res.json({
        success: true,
        matchId: savedMatch.id,
        metadata,
        analysis,
        uploadedFilePath: req.file.filename,
      });
    } catch (dbError) {
      console.warn("Failed to save match to database:", dbError);
      return res.json({
        success: true,
        metadata,
        analysis,
        uploadedFilePath: req.file.filename,
        warning: "Analysis complete but failed to save to database",
      });
    }
  } catch (error: any) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    console.error("Upload/analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze demo file: " + error.message,
    });
  }
};

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
const multerErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: Function
) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "File is too large. Maximum file size is 1GB.",
      });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    console.error("Upload error:", err);
    return res.status(400).json({ error: err.message });
  }
  next();
};

// POST /api/analyze
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
  } catch (error: any) {
    console.error("Analysis error:", error);
    return res.status(500).json({ error: "Failed to analyze demo: " + error.message });
  }
};

// GET /api/analyze/status/:fileName
const getAnalysisStatus = async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(uploadsDir, fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });

    const analysis = {
      status: "completed",
      progress: 100,
      fileName,
      completedAt: new Date(),
    };

    return res.json(analysis);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get status: " + error.message });
  }
};

// Routes
router.post("/upload", upload.single("file"), multerErrorHandler, uploadAndAnalyze);
router.post("/", analyzeDemo);
router.get("/status/:fileName", getAnalysisStatus);

export default router;
