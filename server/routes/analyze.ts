import { Router, Request, Response, RequestHandler } from "express";
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
      return cb(new Error("Only .dem files are supported"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit
});

/**
 * POST /api/analyze/upload
 * Upload and analyze a demo file using Python script on VPS
 */
const uploadAndAnalyze: RequestHandler = async (req, res) => {
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

    // Validate demo file
    if (!isValidDemoFile(filePath)) {
      console.warn("Demo file validation failed for:", req.file.originalname);
      try {
        fs.unlinkSync(filePath);
      } catch {
        /* ignore */
      }
      return res.status(400).json({
        error: "Invalid demo file format. Please upload a valid CS2 demo file.",
      });
    }

    // Get file metadata
    const metadata = getDemoFileMetadata(filePath);
    console.log("File metadata:", metadata);

    // Try to execute Python script for accurate demo analysis
    let analysis: any;
    let pythonScriptUsed = false;
    try {
      const pythonScriptPath = "/var/www/cs2-analysis/scripts/parse_demo.py";
      console.log("Executing Python script:", pythonScriptPath, "with file:", filePath);

      const { stdout, stderr } = await execFileAsync("python3", [
        pythonScriptPath,
        filePath,
      ], {
        timeout: 60000, // 60 second timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr) {
        console.warn("Python script stderr:", stderr);
      }

      try {
        const pythonOutput = JSON.parse(stdout);
        if (!pythonOutput.success) {
          throw new Error(pythonOutput.error || "Python script failed");
        }
        analysis = transformPythonOutput(pythonOutput);
        pythonScriptUsed = true;
        console.log("Python script analysis successful for:", req.file.originalname);
      } catch (parseError) {
        console.error("Failed to parse Python script output:", parseError);
        throw new Error("Invalid output from Python script");
      }
    } catch (pythonError) {
      console.warn("Python script execution failed, falling back to DemoAnalyzer:", pythonError);
      // Fallback to JavaScript analyzer if Python script fails
      const analyzer = new DemoAnalyzer(filePath);
      analysis = await analyzer.analyze();
      console.log("Using fallback DemoAnalyzer for:", req.file.originalname);
    }

    // Save match to database
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
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore cleanup errors */
      }
    }

    console.error("Upload/analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze demo file: " + (error as Error).message,
    });
  }
};

/**
 * Error handler for multer
 */
/**
 * Transform Python script output to MatchService format
 */
function transformPythonOutput(pythonData: any): any {
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

/**
 * Error handler for multer
 */
const multerErrorHandler: RequestHandler = (err: any, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    if (err.code === "FILE_TOO_LARGE") {
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

/**
 * POST /api/analyze
 * Analyze uploaded demo file
 */
const analyzeDemo: RequestHandler = async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: "No file path provided" });
    }

    const fullPath = path.join(uploadsDir, filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    if (!isValidDemoFile(fullPath)) {
      return res.status(400).json({ error: "Invalid demo file format" });
    }

    const analyzer = new DemoAnalyzer(fullPath);
    const analysis = await analyzer.analyze();

    return res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze demo: " + (error as Error).message,
    });
  }
};

/**
 * GET /api/analyze/status/:fileName
 * Get analysis status
 */
const getAnalysisStatus: RequestHandler = async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(uploadsDir, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Simulate analysis status
    const analysis = {
      status: "completed",
      progress: 100,
      fileName,
      completedAt: new Date(),
    };

    return res.json(analysis);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to get status: " + (error as Error).message,
    });
  }
};

// Routes
router.post(
  "/upload",
  upload.single("file"),
  multerErrorHandler,
  uploadAndAnalyze,
);
router.post("/", analyzeDemo);
router.get("/status/:fileName", getAnalysisStatus);

export default router;
