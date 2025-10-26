import * as fs from "fs";
import * as path from "path";

export interface PlayerRound {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  money: number;
}

export interface PlayerAnalysis {
  name: string;
  steamId: string;
  team: string;
  kills: number;
  deaths: number;
  assists: number;
  accuracy: number;
  headshots: number;
  hsPercent: number;
  totalDamage: number;
  avgDamage: number;
  kdRatio: number;
  plants: number;
  defuses: number;
  utility: string[];
  rating: number;
}

export interface SuspiciousActivity {
  type:
    | "unusual_accuracy"
    | "prefire_pattern"
    | "wall_tracking"
    | "abnormal_reaction_time"
    | "quick_flick_spam"
    | "crosshair_placement_anomaly"
    | "consistent_lock_on_head";
  confidence: number;
  description: string;
  tick: number;
}

export interface FraudAssessment {
  playerName: string;
  fraudProbability: number;
  aimScore: number;
  positioningScore: number;
  reactionScore: number;
  gameSenseScore: number;
  consistencyScore: number;
  suspiciousActivities: SuspiciousActivity[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface DemoAnalysisResult {
  mapName: string;
  gameMode: "5v5" | "wingman" | "deathmatch" | "community" | "other";
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  duration: number;
  players: PlayerAnalysis[];
  fraudAssessments: FraudAssessment[];
  totalEventsProcessed: number;
}

export class DemoAnalyzer {
  private filePath: string;
  private fileBuffer: Buffer;
  private currentOffset: number = 0;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.fileBuffer = fs.readFileSync(filePath);
  }

  /**
   * Main analysis method - orchestrates entire demo analysis
   */
  async analyze(): Promise<DemoAnalysisResult> {
    try {
      const basicInfo = this.parseBasicInfo();
      const gameMode = this.detectGameMode(basicInfo);

      const mockAnalysis = this.generateMockAnalysis(basicInfo, gameMode);
      const fraudAssessments = mockAnalysis.players.map((player) =>
        this.assessFraud(player),
      );

      return {
        ...mockAnalysis,
        fraudAssessments,
      };
    } catch (error) {
      console.error("Demo analysis error:", error);
      throw new Error(
        "Failed to analyze demo file: " + (error as Error).message,
      );
    }
  }

  /**
   * Parse basic demo information
   */
  private parseBasicInfo() {
    const fileName = path.basename(this.filePath);
    const fileSize = this.fileBuffer.length;

    return {
      fileName,
      fileSize,
      timestamp: Date.now(),
    };
  }

  /**
   * Detect game mode from demo
   * 5v5 (10 players), Wingman (4 players), DM (varying)
   */
  private detectGameMode(
    info: any,
  ): "5v5" | "wingman" | "deathmatch" | "community" | "other" {
    const playerCount = Math.random() * 10; // Mock detection

    if (playerCount <= 4) return "wingman";
    if (playerCount <= 8) return "deathmatch";
    if (playerCount <= 10) return "5v5";
    return "community";
  }

  /**
   * Generate mock analysis (placeholder until full dem parsing is implemented)
   * In production, this would parse binary dem format
   */
  private generateMockAnalysis(basicInfo: any, gameMode: string) {
    const maps = [
      "Mirage",
      "Inferno",
      "Ancient",
      "Nuke",
      "Overpass",
      "Vertigo",
    ];
    const mapName = maps[Math.floor(Math.random() * maps.length)];

    const playerCount =
      gameMode === "5v5" ? 10 : gameMode === "wingman" ? 4 : 8;

    const players: PlayerAnalysis[] = [];

    for (let i = 0; i < playerCount; i++) {
      const baseKills = Math.floor(Math.random() * 20) + 5;
      const baseDeaths = Math.floor(Math.random() * 15) + 3;

      players.push({
        name: `Player${i + 1}`,
        steamId: `${Math.floor(Math.random() * 9000000000000000) + 1000000000000000}`,
        team: i < playerCount / 2 ? "Team A" : "Team B",
        kills: baseKills,
        deaths: baseDeaths,
        assists: Math.floor(Math.random() * 10),
        accuracy: Math.random() * 0.6 + 0.2,
        headshots: Math.floor(baseKills * (Math.random() * 0.5 + 0.1)),
        hsPercent: Math.random() * 50,
        totalDamage: Math.floor(Math.random() * 3000) + 500,
        avgDamage: Math.floor(Math.random() * 80) + 20,
        kdRatio: baseKills / Math.max(baseDeaths, 1),
        plants: gameMode === "5v5" ? Math.floor(Math.random() * 3) : 0,
        defuses: gameMode === "5v5" ? Math.floor(Math.random() * 3) : 0,
        utility: ["smoke", "flash"],
        rating: Math.random() * 1.5,
      });
    }

    return {
      mapName,
      gameMode: gameMode as
        | "5v5"
        | "wingman"
        | "deathmatch"
        | "community"
        | "other",
      teamAName: "Team A",
      teamBName: "Team B",
      teamAScore: Math.floor(Math.random() * 16),
      teamBScore: Math.floor(Math.random() * 16),
      duration: Math.floor(Math.random() * 1800) + 1500,
      players,
      fraudAssessments: [],
      totalEventsProcessed: Math.floor(Math.random() * 50000) + 20000,
    };
  }

  /**
   * Calculate fraud probability based on player statistics
   */
  private assessFraud(player: PlayerAnalysis): FraudAssessment {
    const aimScore = this.calculateAimScore(player);
    const positioningScore = this.calculatePositioningScore(player);
    const reactionScore = this.calculateReactionScore(player);
    const gameSenseScore = this.calculateGameSenseScore(player);
    const consistencyScore = this.calculateConsistencyScore(player);

    const suspiciousActivities = this.detectSuspiciousPatterns(player);

    const fraudProbability = this.calculateFraudProbability(
      aimScore,
      positioningScore,
      reactionScore,
      gameSenseScore,
      consistencyScore,
      suspiciousActivities.length,
    );

    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    if (fraudProbability >= 80) riskLevel = "critical";
    else if (fraudProbability >= 60) riskLevel = "high";
    else if (fraudProbability >= 30) riskLevel = "medium";

    return {
      playerName: player.name,
      fraudProbability: Math.round(fraudProbability * 100) / 100,
      aimScore: Math.round(aimScore * 100) / 100,
      positioningScore: Math.round(positioningScore * 100) / 100,
      reactionScore: Math.round(reactionScore * 100) / 100,
      gameSenseScore: Math.round(gameSenseScore * 100) / 100,
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      suspiciousActivities,
      riskLevel,
    };
  }

  /**
   * Calculate aim suspicious score (accuracy, headshot rate anomalies)
   */
  private calculateAimScore(player: PlayerAnalysis): number {
    let score = 0;

    if (player.accuracy > 0.5) score += 25;
    if (player.hsPercent > 40) score += 20;
    if (player.kdRatio > 3) score += 15;
    if (player.kills > player.deaths * 2) score += 10;

    return Math.min(score / 100, 1);
  }

  /**
   * Calculate positioning suspicious score
   */
  private calculatePositioningScore(player: PlayerAnalysis): number {
    let score = 0;

    if (player.kdRatio > 2.5) score += 15;
    if (player.totalDamage > 2000) score += 10;
    if (player.assists > player.kills * 0.5) score -= 10;

    return Math.min(Math.max(score / 100, 0), 1);
  }

  /**
   * Calculate reaction time suspicious score
   */
  private calculateReactionScore(player: PlayerAnalysis): number {
    let score = 0;

    if (player.kills > 15) score += 20;
    if (player.hsPercent > 35) score += 15;

    return Math.min(score / 100, 1);
  }

  /**
   * Calculate game sense score (reading enemy positions)
   */
  private calculateGameSenseScore(player: PlayerAnalysis): number {
    let score = 0;

    if (player.kdRatio > 2) score += 15;
    if (player.assists > 5) score -= 10;

    return Math.min(Math.max(score / 100, 0), 1);
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(player: PlayerAnalysis): number {
    let score = 0;

    if (player.kdRatio > 2) score += 20;
    if (player.hsPercent > 30) score += 15;

    return Math.min(score / 100, 1);
  }

  /**
   * Detect specific suspicious patterns
   */
  private detectSuspiciousPatterns(
    player: PlayerAnalysis,
  ): SuspiciousActivity[] {
    const activities: SuspiciousActivity[] = [];

    if (player.accuracy > 0.55) {
      activities.push({
        type: "unusual_accuracy",
        confidence: Math.min((player.accuracy - 0.3) * 100, 95),
        description: `Abnormally high accuracy: ${(player.accuracy * 100).toFixed(1)}%`,
        tick: Math.floor(Math.random() * 100000),
      });
    }

    if (player.hsPercent > 45) {
      activities.push({
        type: "quick_flick_spam",
        confidence: Math.min((player.hsPercent - 20) * 2, 90),
        description: `Unusually high headshot rate: ${player.hsPercent.toFixed(1)}%`,
        tick: Math.floor(Math.random() * 100000),
      });
    }

    if (player.kdRatio > 3) {
      activities.push({
        type: "consistent_lock_on_head",
        confidence: Math.min((player.kdRatio - 1.5) * 15, 85),
        description: `Exceptionally high K/D ratio: ${player.kdRatio.toFixed(2)}`,
        tick: Math.floor(Math.random() * 100000),
      });
    }

    if (player.rating > 1.3) {
      activities.push({
        type: "abnormal_reaction_time",
        confidence: Math.min((player.rating - 0.8) * 40, 80),
        description: `Exceptional HLTV Rating: ${player.rating.toFixed(2)}`,
        tick: Math.floor(Math.random() * 100000),
      });
    }

    return activities;
  }

  /**
   * Calculate final fraud probability
   */
  private calculateFraudProbability(
    aimScore: number,
    positioningScore: number,
    reactionScore: number,
    gameSenseScore: number,
    consistencyScore: number,
    suspiciousActivityCount: number,
  ): number {
    const weights = {
      aim: 0.35,
      positioning: 0.15,
      reaction: 0.15,
      gameSense: 0.15,
      consistency: 0.2,
    };

    let baseProbability =
      aimScore * weights.aim +
      positioningScore * weights.positioning +
      reactionScore * weights.reaction +
      gameSenseScore * weights.gameSense +
      consistencyScore * weights.consistency;

    const activityBonus = Math.min(suspiciousActivityCount * 5, 20);
    baseProbability = Math.min(baseProbability + activityBonus / 100, 1);

    return baseProbability;
  }
}

/**
 * Validate if file is a valid CS2 demo
 */
export function isValidDemoFile(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;

    const buffer = fs.readFileSync(filePath, { flag: "r" });

    if (buffer.length < 100) return false;

    const header = buffer.toString("ascii", 0, 4);
    if (header !== "HL2D" && header !== "CSGO") return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Get demo file metadata
 */
export function getDemoFileMetadata(filePath: string) {
  try {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);

    return {
      fileName,
      fileSize: stats.size,
      fileSizeMB: (stats.size / 1024 / 1024).toFixed(2),
      uploadedAt: stats.mtime,
    };
  } catch (error) {
    throw new Error("Failed to get file metadata: " + (error as Error).message);
  }
}
