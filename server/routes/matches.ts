import { Router, RequestHandler } from "express";
import { MatchService } from "../services/matchService";

const router = Router();

/**
 * GET /api/matches
 * Get all matches
 */
const getAllMatches: RequestHandler = (req, res) => {
  try {
    const matches = MatchService.getAllMatches();
    return res.json({
      success: true,
      matches,
      count: matches.length,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch matches: " + (error as Error).message,
    });
  }
};

/**
 * GET /api/matches/:id
 * Get specific match with full details
 */
const getMatchById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);

    const matchData = MatchService.getMatchById(matchId);
    if (!matchData) {
      return res.status(404).json({
        error: "Match not found",
      });
    }

    return res.json({
      success: true,
      data: matchData,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch match: " + (error as Error).message,
    });
  }
};

/**
 * GET /api/matches/:id/stats
 * Get match statistics
 */
const getMatchStats: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);

    const stats = MatchService.getMatchStats(matchId);
    if (!stats) {
      return res.status(404).json({
        error: "Match not found",
      });
    }

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch match stats: " + (error as Error).message,
    });
  }
};

/**
 * DELETE /api/matches/:id
 * Delete a specific match
 */
const deleteMatch: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);

    const success = MatchService.deleteMatch(matchId);
    if (!success) {
      return res.status(404).json({
        error: "Match not found",
      });
    }

    return res.json({
      success: true,
      message: "Match deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete match: " + (error as Error).message,
    });
  }
};

// Routes
router.get("/", getAllMatches);
router.get("/:id", getMatchById);
router.get("/:id/stats", getMatchStats);
router.delete("/:id", deleteMatch);

export default router;
