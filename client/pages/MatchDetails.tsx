import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MatchDetails() {
  const { logout } = useAuth();
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

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

  const getMatchResult = () => {
    if (match.teamAScore > match.teamBScore) return "VICTORY";
    if (match.teamBScore > match.teamAScore) return "DEFEAT";
    return "DRAW";
  };

  const selectedPlayerData = players.find(
    (p: any) => p.name === selectedPlayer,
  );
  const selectedPlayerFraud = fraudAssessments.find(
    (f: any) => f.playerName === selectedPlayer,
  );

  return (
    <Layout onLogout={logout}>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-slate-700 text-slate-400 hover:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-5xl font-bold text-white">
                {getMatchResult()}
              </h1>
              <div className="text-5xl font-bold gradient-text">
                {match.teamAScore}:{match.teamBScore}
              </div>
            </div>
            <p className="text-slate-400 text-lg">
              {match.teamAName} vs {match.teamBName} • {match.mapName} •{" "}
              {match.gameMode.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-slate-900/50 border border-slate-700">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs sm:text-sm">
              Details
            </TabsTrigger>
            <TabsTrigger value="h2h" className="text-xs sm:text-sm">
              H2H
            </TabsTrigger>
            <TabsTrigger value="rating" className="text-xs sm:text-sm">
              Rating
            </TabsTrigger>
            <TabsTrigger value="zones" className="text-xs sm:text-sm">
              Zones
            </TabsTrigger>
            <TabsTrigger value="players" className="text-xs sm:text-sm">
              Players
            </TabsTrigger>
            <TabsTrigger value="clips" className="text-xs sm:text-sm">
              Klipy
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur">
              <CardContent className="py-8">
                <div className="flex items-center justify-between gap-8">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm font-medium mb-2">
                      {match.teamAName}
                    </p>
                    <div className="text-6xl font-bold gradient-text mb-2">
                      {match.teamAScore}
                    </div>
                    <p className="text-slate-500 text-xs">
                      {
                        players.filter((p: any) => p.team === match.teamAName)
                          .length
                      }{" "}
                      players
                    </p>
                  </div>

                  <div className="text-center">
                    <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-medium">
                      Winner: {getWinnerTeam()}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-slate-400 text-sm font-medium mb-2">
                      {match.teamBName}
                    </p>
                    <div className="text-6xl font-bold gradient-text mb-2">
                      {match.teamBScore}
                    </div>
                    <p className="text-slate-500 text-xs">
                      {
                        players.filter((p: any) => p.team === match.teamBName)
                          .length
                      }{" "}
                      players
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    {[match.teamAName, match.teamBName].map(
                      (teamName: string) => {
                        const teamData = teamStats[teamName];
                        if (!teamData) return null;

                        return (
                          <div
                            key={teamName}
                            className="bg-slate-800/50 rounded-lg p-4 space-y-3"
                          >
                            <p className="text-white font-bold text-lg">
                              {teamName}
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-slate-400 text-xs mb-1">
                                  Total Kills
                                </p>
                                <p className="text-white font-bold text-xl">
                                  {teamData.totalKills}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">
                                  Total Deaths
                                </p>
                                <p className="text-white font-bold text-xl">
                                  {teamData.totalDeaths}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">
                                  Total Damage
                                </p>
                                <p className="text-white font-bold text-xl">
                                  {teamData.totalDamage}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">
                                  Avg Rating
                                </p>
                                <p className="text-white font-bold text-xl">
                                  {teamData.avgRating}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">
                                  Avg Accuracy
                                </p>
                                <p className="text-white font-bold text-xl">
                                  {(
                                    parseFloat(teamData.avgAccuracy) * 100
                                  ).toFixed(1)}
                                  %
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">
                                  Fraud Risk
                                </p>
                                <p
                                  className={`font-bold text-xl ${
                                    parseFloat(teamData.avgFraudProbability) >
                                    50
                                      ? "text-red-400"
                                      : "text-green-400"
                                  }`}
                                >
                                  {parseFloat(
                                    teamData.avgFraudProbability,
                                  ).toFixed(1)}
                                  %
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* MATCH DETAILS TAB */}
          <TabsContent value="details" className="space-y-6 mt-6">
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Match Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Map</p>
                    <p className="text-white font-bold text-lg">
                      {match.mapName}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Game Mode</p>
                    <p className="text-white font-bold text-lg">
                      {match.gameMode.toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-2">Duration</p>
                    <p className="text-white font-bold text-lg">
                      {Math.floor(match.duration / 60)}:
                      {(match.duration % 60).toString().padStart(2, "0")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Player Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">
                          Player
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          K
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          D
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          A
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          K/D
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          ADR
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          HS%
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player: any) => (
                        <tr
                          key={player.name}
                          className="border-b border-slate-700 hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-white font-medium">
                                {player.name}
                              </p>
                              <p className="text-slate-500 text-xs">
                                {player.team}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-white font-medium">
                            {player.kills}
                          </td>
                          <td className="py-3 px-4 text-center text-white font-medium">
                            {player.deaths}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            {player.assists}
                          </td>
                          <td className="py-3 px-4 text-center text-white font-medium">
                            {player.kdRatio?.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            {player.avgDamage}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            {player.hsPercent?.toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 text-center text-white font-medium">
                            {player.rating?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HEAD TO HEAD TAB */}
          <TabsContent value="h2h" className="space-y-6 mt-6">
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Team Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">
                          Stat
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          {match.teamAName}
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          {match.teamBName}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats && (
                        <>
                          <tr className="border-b border-slate-700">
                            <td className="py-3 px-4 text-white font-medium">
                              Total Kills
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {teamStats[match.teamAName]?.totalKills}
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {teamStats[match.teamBName]?.totalKills}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-700">
                            <td className="py-3 px-4 text-white font-medium">
                              Total Deaths
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {teamStats[match.teamAName]?.totalDeaths}
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {teamStats[match.teamBName]?.totalDeaths}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-700">
                            <td className="py-3 px-4 text-white font-medium">
                              Total Damage
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {teamStats[match.teamAName]?.totalDamage}
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {teamStats[match.teamBName]?.totalDamage}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-700">
                            <td className="py-3 px-4 text-white font-medium">
                              Avg Accuracy
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {(
                                parseFloat(
                                  teamStats[match.teamAName]?.avgAccuracy,
                                ) * 100
                              ).toFixed(1)}
                              %
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {(
                                parseFloat(
                                  teamStats[match.teamBName]?.avgAccuracy,
                                ) * 100
                              ).toFixed(1)}
                              %
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 text-white font-medium">
                              Avg Rating
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {teamStats[match.teamAName]?.avgRating}
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {teamStats[match.teamBName]?.avgRating}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RATING BREAKDOWN TAB */}
          <TabsContent value="rating" className="space-y-6 mt-6">
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Rating Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">
                          Player
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          Rating
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          Aim
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          Pos
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">
                          GS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player: any) => {
                        const fraud = fraudAssessments.find(
                          (f: any) => f.playerName === player.name,
                        );
                        return (
                          <tr
                            key={player.name}
                            className="border-b border-slate-700 hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-4 text-white font-medium">
                              {player.name}
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {player.rating?.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-300">
                              {fraud?.aimScore?.toFixed(1)}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-300">
                              {fraud?.positioningScore?.toFixed(1)}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-300">
                              {fraud?.gameSenseScore?.toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MAP ZONES TAB */}
          <TabsContent value="zones" className="space-y-6 mt-6">
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardContent className="py-12 text-center">
                <div className="text-slate-400">
                  <p className="text-lg font-medium mb-2">Map Zones Analysis</p>
                  <p className="text-sm">
                    Coming soon - Heat map data will be displayed here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CHECK PLAYERS TAB */}
          <TabsContent value="players" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Players</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                  {players.map((player: any) => (
                    <button
                      key={player.name}
                      onClick={() => setSelectedPlayer(player.name)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedPlayer === player.name
                          ? "bg-blue-500 text-white"
                          : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <p className="font-medium text-sm">{player.name}</p>
                      <p className="text-xs opacity-80">{player.kills} kills</p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                {selectedPlayerData && selectedPlayerFraud ? (
                  <>
                    <Card className="border-slate-700 bg-gradient-to-br from-blue-500/20 to-slate-900/50 backdrop-blur">
                      <CardContent className="py-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                              {selectedPlayerData.name}
                            </h3>
                            <p className="text-slate-400">
                              {selectedPlayerData.team}
                            </p>
                          </div>
                          <div
                            className={`text-right px-4 py-2 rounded-lg ${
                              selectedPlayerFraud.fraudProbability > 70
                                ? "bg-red-500/20 border border-red-500"
                                : selectedPlayerFraud.fraudProbability > 40
                                  ? "bg-yellow-500/20 border border-yellow-500"
                                  : "bg-green-500/20 border border-green-500"
                            }`}
                          >
                            <p className="text-xs text-slate-400 mb-1">
                              Fraud Risk
                            </p>
                            <p
                              className={`text-2xl font-bold ${
                                selectedPlayerFraud.fraudProbability > 70
                                  ? "text-red-400"
                                  : selectedPlayerFraud.fraudProbability > 40
                                    ? "text-yellow-400"
                                    : "text-green-400"
                              }`}
                            >
                              {selectedPlayerFraud.fraudProbability.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Kills</p>
                            <p className="text-white font-bold text-xl">
                              {selectedPlayerData.kills}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">
                              Deaths
                            </p>
                            <p className="text-white font-bold text-xl">
                              {selectedPlayerData.deaths}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">K/D</p>
                            <p className="text-white font-bold text-xl">
                              {selectedPlayerData.kdRatio.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">HS%</p>
                            <p className="text-white font-bold text-xl">
                              {selectedPlayerData.hsPercent.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">
                          Detailed Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Accuracy
                            </p>
                            <p className="text-white font-bold">
                              {(selectedPlayerData.accuracy * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Rating
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerData.rating.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Total Damage
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerData.totalDamage}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Avg Damage/Kill
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerData.avgDamage}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Headshots
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerData.headshots}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Assists
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerData.assists}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          Fraud Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Aim Score
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerFraud.aimScore.toFixed(1)}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Positioning
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerFraud.positioningScore.toFixed(1)}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Reaction
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerFraud.reactionScore.toFixed(1)}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Game Sense
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerFraud.gameSenseScore.toFixed(1)}
                            </p>
                          </div>
                        </div>

                        {selectedPlayerFraud.suspiciousActivities?.length >
                          0 && (
                          <div className="space-y-2 mt-4 pt-4 border-t border-slate-700">
                            <p className="text-white font-medium text-sm">
                              Suspicious Indicators:
                            </p>
                            {selectedPlayerFraud.suspiciousActivities.map(
                              (activity: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-sm"
                                >
                                  <p className="text-red-300 font-medium">
                                    {activity.description}
                                  </p>
                                  <p className="text-red-400 text-xs">
                                    Confidence: {activity.confidence.toFixed(1)}
                                    %
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        <div
                          className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                            selectedPlayerFraud.riskLevel === "critical"
                              ? "bg-red-500/20 text-red-300 border border-red-500"
                              : selectedPlayerFraud.riskLevel === "high"
                                ? "bg-orange-500/20 text-orange-300 border border-orange-500"
                                : selectedPlayerFraud.riskLevel === "medium"
                                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500"
                                  : "bg-green-500/20 text-green-300 border border-green-500"
                          }`}
                        >
                          Risk Level:{" "}
                          {selectedPlayerFraud.riskLevel.toUpperCase()}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                    <CardContent className="py-12 text-center">
                      <p className="text-slate-400">
                        Select a player to view detailed assessment
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* PODEJRZANE KLIPY TAB */}
          <TabsContent value="clips" className="space-y-6 mt-6">
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-slate-400 mb-2">
                  Podejrzane klipy
                </p>
                <p className="text-slate-500">
                  Ta zakładka jest w trakcie budowy
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
