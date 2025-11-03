import { Router, Request, Response } from "express";
import * as path from "path";
import * as fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { MatchService } from "../services/matchService";

const execFileAsync = promisify(execFile);
const router = Router();

const CLIPS_DIR = path.join(process.cwd(), "dist/spa/clips");
const DEMO_UPLOADS_DIR = path.join(process.cwd(), "dist/spa/uploads");
const CLIP_GENERATOR_SCRIPT = "/var/www/cs2-analysis/scripts/generate_clips.py";

// Ensure clips directory exists
if (!fs.existsSync(CLIPS_DIR)) {
  fs.mkdirSync(CLIPS_DIR, { recursive: true });
}

/**
 * GET /api/clips/:matchId
 * List all clips for a match
 */
router.get("/:matchId", (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const matchClipsDir = path.join(CLIPS_DIR, matchId);

    if (!fs.existsSync(matchClipsDir)) {
      return res.json({
        success: true,
        clips: [],
        matchId,
      });
    }

    const files = fs.readdirSync(matchClipsDir);
    const clips = files
      .filter((f) => f.endsWith(".mp4"))
      .map((file) => {
        const filePath = path.join(matchClipsDir, file);
        const stats = fs.statSync(filePath);

        return {
          id: file.replace(".mp4", ""),
          filename: file,
          path: `/clips/${matchId}/${file}`,
          size: stats.size,
          sizeMB: (stats.size / 1024 / 1024).toFixed(2),
          createdAt: stats.mtime,
        };
      });

    res.json({
      success: true,
      clips,
      matchId,
      totalClips: clips.length,
    });
  } catch (err) {
    console.error("Error listing clips:", err);
    res.status(500).json({
      success: false,
      error: "Failed to list clips",
    });
  }
});

/**
 * GET /api/clips/:matchId/:clipId/download
 * Download/stream a clip
 */
router.get("/:matchId/:clipId/download", (req: Request, res: Response) => {
  try {
    const { matchId, clipId } = req.params;
    const clipFile = path.join(CLIPS_DIR, matchId, `${clipId}.mp4`);

    // Security: prevent directory traversal
    if (!clipFile.startsWith(CLIPS_DIR)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!fs.existsSync(clipFile)) {
      return res.status(404).json({ error: "Clip not found" });
    }

    const stat = fs.statSync(clipFile);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": "video/mp4",
      });

      fs.createReadStream(clipFile, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": stat.size,
        "Content-Type": "video/mp4",
      });

      fs.createReadStream(clipFile).pipe(res);
    }
  } catch (err) {
    console.error("Error downloading clip:", err);
    res.status(500).json({
      success: false,
      error: "Failed to download clip",
    });
  }
});

/**
 * POST /api/clips/:matchId/generate
 * Generate clips for a match
 * Body: { numClips: 1-15, sensitivity: 1-5 }
 */
router.post("/:matchId/generate", async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    let { numClips = 10, sensitivity = 3 } = req.body;

    // Validate
    numClips = Math.max(1, Math.min(15, parseInt(numClips) || 10));
    sensitivity = Math.max(1, Math.min(5, parseInt(sensitivity) || 3));

    // Find demo file for this match
    const matchData = MatchService.getMatchById(parseInt(matchId));
    if (!matchData) {
      return res.status(404).json({
        success: false,
        error: "Match not found",
      });
    }

    const demoFileName = matchData.match.demoFileName;
    const demoPath = path.join(DEMO_UPLOADS_DIR, demoFileName);

    if (!fs.existsSync(demoPath)) {
      return res.status(404).json({
        success: false,
        error: "Demo file not found",
      });
    }

    console.log(`Starting clip generation for match ${matchId}`);
    console.log(`  Demo: ${demoPath}`);
    console.log(`  Num clips: ${numClips}, Sensitivity: ${sensitivity}`);

    // Execute Python script
    const { stdout, stderr } = await execFileAsync("python3", [
      CLIP_GENERATOR_SCRIPT,
      demoPath,
      CLIPS_DIR,
      matchId,
      numClips.toString(),
      sensitivity.toString(),
    ]);

    if (stderr) {
      console.warn("Clip generator stderr:", stderr);
    }

    try {
      const result = JSON.parse(stdout);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || "Clip generation failed",
        });
      }

      console.log(
        `✅ Generated ${result.clips_generated} clips for match ${matchId}`
      );

      res.json({
        success: true,
        matchId,
        clipsGenerated: result.clips_generated,
        clips: result.clips,
        message: `Successfully generated ${result.clips_generated} clips`,
      });
    } catch (parseErr) {
      console.error("Failed to parse clip generator output:", parseErr);
      res.status(500).json({
        success: false,
        error: "Invalid response from clip generator",
      });
    }
  } catch (err) {
    console.error("Error generating clips:", err);
    res.status(500).json({
      success: false,
      error: "Failed to generate clips: " + (err as Error).message,
    });
  }
});

/**
 * DELETE /api/clips/:matchId/:clipId
 * Delete a specific clip
 */
router.delete("/:matchId/:clipId", (req: Request, res: Response) => {
  try {
    const { matchId, clipId } = req.params;
    const clipFile = path.join(CLIPS_DIR, matchId, `${clipId}.mp4`);

    // Security check
    if (!clipFile.startsWith(CLIPS_DIR)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!fs.existsSync(clipFile)) {
      return res.status(404).json({
        success: false,
        error: "Clip not found",
      });
    }

    fs.unlinkSync(clipFile);
    console.log(`✅ Deleted clip: ${clipFile}`);

    res.json({
      success: true,
      message: "Clip deleted",
    });
  } catch (err) {
    console.error("Error deleting clip:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete clip",
    });
  }
});

/**
 * DELETE /api/clips/:matchId
 * Delete all clips for a match
 */
router.delete("/:matchId", (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const matchClipsDir = path.join(CLIPS_DIR, matchId);

    if (fs.existsSync(matchClipsDir)) {
      const files = fs.readdirSync(matchClipsDir);
      for (const file of files) {
        if (file.endsWith(".mp4")) {
          fs.unlinkSync(path.join(matchClipsDir, file));
        }
      }
      // Remove directory
      fs.rmdirSync(matchClipsDir, { recursive: true });
      console.log(`✅ Deleted all clips for match ${matchId}`);
    }

    res.json({
      success: true,
      message: `All clips deleted for match ${matchId}`,
    });
  } catch (err) {
    console.error("Error deleting clips:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete clips",
    });
  }
});

export default router;
