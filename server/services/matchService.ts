// Match service - handles database operations for matches
// For now using mock data, but structure ready for real DB

export interface Match {
  id: number;
  demoFileName: string;
  gameMode: string;
  mapName: string;
  matchDate: string;
  duration: number;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  uploadedAt: string;
}

export interface MatchPlayer {
  id: number;
  matchId: number;
  name: string;
  team: string;
  kills: number;
  deaths: number;
  assists: number;
  accuracy: number;
  headshots: number;
  hsPercent: number;
  totalDamage: number;
  kdRatio: number;
  rating: number;
}

// Mock storage (replace with real database later)
const matchesDatabase: Map<number, any> = new Map();
let matchIdCounter = 1;

export class MatchService {
  /**
   * Save match from demo analysis
   */
  static saveMatch(matchData: any): Match {
    const match: Match = {
      id: matchIdCounter++,
      demoFileName: matchData.demoFileName || "demo.dem",
      gameMode: matchData.gameMode,
      mapName: matchData.mapName,
      matchDate: new Date().toISOString(),
      duration: matchData.duration,
      teamAName: matchData.teamAName,
      teamBName: matchData.teamBName,
      teamAScore: matchData.teamAScore,
      teamBScore: matchData.teamBScore,
      uploadedAt: new Date().toISOString(),
    };

    matchesDatabase.set(match.id, {
      match,
      players: matchData.players,
      fraudAssessments: matchData.fraudAssessments,
    });

    return match;
  }

  /**
   * Get all matches
   */
  static getAllMatches(): Match[] {
    const matches: Match[] = [];
    matchesDatabase.forEach((data) => {
      matches.push(data.match);
    });
    return matches.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );
  }

  /**
   * Get match by ID with full details
   */
  static getMatchById(matchId: number): any {
    return matchesDatabase.get(matchId) || null;
  }

  /**
   * Get match statistics for display
   */
  static getMatchStats(matchId: number): any {
    const matchData = matchesDatabase.get(matchId);
    if (!matchData) return null;

    const { match, players, fraudAssessments } = matchData;

    // Calculate team statistics
    const teamAPlayers = players.filter((p: any) => p.team === match.teamAName);
    const teamBPlayers = players.filter((p: any) => p.team === match.teamBName);

    const calculateTeamStats = (teamPlayers: any[]) => ({
      totalKills: teamPlayers.reduce((sum, p) => sum + p.kills, 0),
      totalDeaths: teamPlayers.reduce((sum, p) => sum + p.deaths, 0),
      totalAssists: teamPlayers.reduce((sum, p) => sum + p.assists, 0),
      totalDamage: teamPlayers.reduce((sum, p) => sum + p.totalDamage, 0),
      avgAccuracy: (
        teamPlayers.reduce((sum, p) => sum + p.accuracy, 0) / teamPlayers.length
      ).toFixed(2),
      avgRating: (
        teamPlayers.reduce((sum, p) => sum + p.rating, 0) / teamPlayers.length
      ).toFixed(2),
      avgFraudProbability: (
        fraudAssessments
          .filter((f: any) =>
            teamPlayers.find((p: any) => p.name === f.playerName),
          )
          .reduce((sum: number, f: any) => sum + f.fraudProbability, 0) /
        teamPlayers.length
      ).toFixed(2),
    });

    const teamAStats = calculateTeamStats(teamAPlayers);
    const teamBStats = calculateTeamStats(teamBPlayers);

    return {
      match,
      players,
      fraudAssessments,
      teamStats: {
        [match.teamAName]: teamAStats,
        [match.teamBName]: teamBStats,
      },
    };
  }
}
