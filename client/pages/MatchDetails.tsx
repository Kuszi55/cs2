import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Trophy,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";

export default function MatchDetails() {
  const { logout } = useAuth();
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) return;

      try {
        setIsLoading(true);
        const [detailRes, statsRes] = await Promise.all([
          fetch(`/api/matches/${matchId}`),
          fetch(`/api/matches/${matchId}/stats`),
        ]);

        const detailData = await detailRes.json();
        const statsData = await statsRes.json();

        if (detailData.success) {
          setMatchData(detailData.data);
        }
        if (statsData.success) {
          setStats(statsData.stats);
        }
      } catch (err) {
        console.error("Error fetching match details:", err);
        setError("Failed to load match details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchData();
  }, [matchId]);

  if (isLoading) {
    return (
      <Layout onLogout={logout}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mr-3" />
          <p className="text-slate-400">Loading match details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !matchData) {
    return (
      <Layout onLogout={logout}>
        <div className="text-center py-20">
          <p className="text-red-400">{error || "Match not found"}</p>
          <Button onClick={() => window.history.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  const match = matchData.match || matchData;
  const players = matchData.players || [];
  const fraudAssessments = matchData.fraudAssessments || [];
  const teamStats = stats?.teamStats || {};

  const getWinnerTeam = () => {
    if (match.teamAScore > match.teamBScore) return match.teamAName;
    if (match.teamBScore > match.teamAScore) return match.teamBName;
    return "Draw";
  };

  return (
    <Layout onLogout={logout}>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-slate-700 text-slate-400 hover:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="border-b border-slate-700 pb-6 flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{match.mapName}</h1>
            <p className="text-slate-400">
              {match.teamAName} vs {match.teamBName} • {match.gameMode.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Match Score Card */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur">
          <CardContent className="py-8">
            <div className="flex items-center justify-between gap-8">
              {/* Team A */}
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium mb-2">{match.teamAName}</p>
                <div className="text-6xl font-bold gradient-text mb-2">{match.teamAScore}</div>
                <p className="text-slate-500 text-xs">
                  {players.filter((p: any) => p.team === match.teamAName).length} players
                </p>
              </div>

              {/* Winner Badge */}
              <div className="text-center">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-medium">
                  Winner: {getWinnerTeam()}
                </p>
              </div>

              {/* Team B */}
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium mb-2">{match.teamBName}</p>
                <div className="text-6xl font-bold gradient-text mb-2">{match.teamBScore}</div>
                <p className="text-slate-500 text-xs">
                  {players.filter((p: any) => p.team === match.teamBName).length} players
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Statistics Comparison */}
        {stats && (
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Team Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[match.teamAName, match.teamBName].map((teamName: string) => {
                  const teamData = teamStats[teamName];
                  if (!teamData) return null;

                  return (
                    <div key={teamName} className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                      <p className="text-white font-bold text-lg">{teamName}</p>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Total Kills</p>
                          <p className="text-white font-bold text-xl">{teamData.totalKills}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Total Deaths</p>
                          <p className="text-white font-bold text-xl">{teamData.totalDeaths}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Total Damage</p>
                          <p className="text-white font-bold text-xl">{teamData.totalDamage}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Avg Rating</p>
                          <p className="text-white font-bold text-xl">{teamData.avgRating}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Avg Accuracy</p>
                          <p className="text-white font-bold text-xl">{(parseFloat(teamData.avgAccuracy) * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Fraud Risk</p>
                          <p className={`font-bold text-xl ${
                            parseFloat(teamData.avgFraudProbability) > 50
                              ? "text-red-400"
                              : "text-green-400"
                          }`}>
                            {parseFloat(teamData.avgFraudProbability).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Performance Table */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Player Performance & Fraud Assessment
            </CardTitle>
            <CardDescription>Detailed stats with cheating probability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Player</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">K/D</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">HS%</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Accuracy</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Damage</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Rating</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Fraud Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player: any) => {
                    const fraud = fraudAssessments.find(
                      (f: any) => f.playerName === player.name
                    );

                    return (
                      <tr
                        key={player.name}
                        className="border-b border-slate-700 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{player.name}</p>
                            <p className="text-slate-500 text-xs">{player.team}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-white font-medium">
                          {player.kdRatio?.toFixed(2) || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {player.hsPercent?.toFixed(1) || "0"}%
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {((player.accuracy || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {player.totalDamage}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {player.rating?.toFixed(2) || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {fraud && (
                            <div className="flex items-center justify-center gap-2">
                              {fraud.fraudProbability > 50 && (
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                              )}
                              <span
                                className={`font-bold ${
                                  fraud.fraudProbability > 60
                                    ? "text-red-400"
                                    : fraud.fraudProbability > 30
                                    ? "text-yellow-400"
                                    : "text-green-400"
                                }`}
                              >
                                {fraud.fraudProbability?.toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* High Risk Players */}
        {fraudAssessments.some((f: any) => f.fraudProbability > 50) && (
          <Card className="border-red-500/30 bg-red-500/10 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Players Requiring Investigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fraudAssessments
                  .filter((f: any) => f.fraudProbability > 50)
                  .map((fraud: any) => (
                    <div
                      key={fraud.playerName}
                      className="p-4 bg-slate-900/50 rounded-lg border border-red-500/20 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-white font-bold">{fraud.playerName}</p>
                        <span className="text-red-400 text-sm font-bold">
                          {fraud.fraudProbability?.toFixed(1)}% Risk
                        </span>
                      </div>
                      {fraud.suspiciousActivities && fraud.suspiciousActivities.length > 0 && (
                        <div className="text-sm text-red-300 space-y-1">
                          {fraud.suspiciousActivities.slice(0, 3).map((activity: any, idx: number) => (
                            <p key={idx}>
                              • {activity.description} ({activity.confidence?.toFixed(0)}% confidence)
                            </p>
                          ))}
                          {fraud.suspiciousActivities.length > 3 && (
                            <p>• +{fraud.suspiciousActivities.length - 3} more suspicious indicators</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
