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
  Play,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingBreakdownChart } from "@/components/RatingBreakdownChart";
import { ClipGeneratorModal } from "@/components/ClipGeneratorModal";
import { VideoPlayer } from "@/components/VideoPlayer";

export default function MatchDetails() {
  const { logout } = useAuth();
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlayerLeft, setSelectedPlayerLeft] = useState<string | null>(
    null,
  );
  const [selectedPlayerRight, setSelectedPlayerRight] = useState<string | null>(
    null,
  );
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [isGeneratingClips, setIsGeneratingClips] = useState(false);
  const [showClipGenerator, setShowClipGenerator] = useState(false);

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) return;

      try {
        setIsLoading(true);
        const [detailRes, statsRes, clipsRes] = await Promise.all([
          fetch(`/api/matches/${matchId}`),
          fetch(`/api/matches/${matchId}/stats`),
          fetch(`/api/clips/${matchId}`),
        ]);

        const detailData = await detailRes.json();
        const statsData = await statsRes.json();
        const clipsData = await clipsRes.json();

        if (detailData.success) {
          setMatchData(detailData.data);
        }
        if (statsData.success) {
          setStats(statsData.stats);
        }
        if (clipsData.success) {
          setClips(clipsData.clips || []);
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

  const handleDeleteClip = async (clipId: string) => {
    if (!matchId) return;

    try {
      const response = await fetch(`/api/clips/${matchId}/${clipId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setClips(clips.filter((c) => c.id !== clipId));
        if (selectedClip?.id === clipId) {
          setSelectedClip(null);
        }
      }
    } catch (err) {
      console.error("Error deleting clip:", err);
    }
  };

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

  const selectedPlayerLeftData = players.find(
    (p: any) => p.name === selectedPlayerLeft,
  );
  const selectedPlayerRightData = players.find(
    (p: any) => p.name === selectedPlayerRight,
  );

  const teamAPlayers = players.filter((p: any) => p.team === match.teamAName);
  const teamBPlayers = players.filter((p: any) => p.team === match.teamBName);

  const getStatComparisonClass = (leftVal: number, rightVal: number) => {
    if (leftVal > rightVal) return "text-green-400";
    if (rightVal > leftVal) return "text-red-400";
    return "text-slate-300";
  };

  return (
    <Layout onLogout={logout}>
      <div className="space-y-6">
        {/* Header */}
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
                      {teamAPlayers.length} players
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
                      {teamBPlayers.length} players
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
                                  {parseFloat(teamData.avgRating).toFixed(2)}
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

          {/* DETAILS TAB */}
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
                            {player.kdRatio?.toFixed(2) || "0.00"}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            {player.avgDamage}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            {player.hsPercent?.toFixed(1) || "0.0"}%
                          </td>
                          <td className="py-3 px-4 text-center text-white font-medium">
                            {player.rating?.toFixed(2) || "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* H2H TAB - PLAYER COMPARISON */}
          <TabsContent value="h2h" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Player Selector */}
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Select Left Player
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                  {players.map((player: any) => (
                    <button
                      key={player.name}
                      onClick={() => setSelectedPlayerLeft(player.name)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedPlayerLeft === player.name
                          ? "bg-blue-500 text-white"
                          : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <p className="font-medium text-sm">{player.name}</p>
                      <p className="text-xs opacity-80">
                        {player.kills}K/{player.deaths}D
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Right Player Selector */}
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Select Right Player
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                  {players.map((player: any) => (
                    <button
                      key={player.name}
                      onClick={() => setSelectedPlayerRight(player.name)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedPlayerRight === player.name
                          ? "bg-red-500 text-white"
                          : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <p className="font-medium text-sm">{player.name}</p>
                      <p className="text-xs opacity-80">
                        {player.kills}K/{player.deaths}D
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {selectedPlayerLeftData && selectedPlayerRightData && (
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">
                    Player Comparison: {selectedPlayerLeftData.name} vs{" "}
                    {selectedPlayerRightData.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">
                            Statistic
                          </th>
                          <th className="text-center py-3 px-4 text-blue-400 font-medium">
                            {selectedPlayerLeftData.name}
                          </th>
                          <th className="text-center py-3 px-4 text-slate-400 font-medium">
                            vs
                          </th>
                          <th className="text-center py-3 px-4 text-red-400 font-medium">
                            {selectedPlayerRightData.name}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 text-white font-medium">
                            Kills
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerLeftData.kills, selectedPlayerRightData.kills)}`}
                          >
                            {selectedPlayerLeftData.kills}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500">
                            —
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerRightData.kills, selectedPlayerLeftData.kills)}`}
                          >
                            {selectedPlayerRightData.kills}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 text-white font-medium">
                            Deaths
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerRightData.deaths, selectedPlayerLeftData.deaths)}`}
                          >
                            {selectedPlayerLeftData.deaths}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500">
                            —
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerLeftData.deaths, selectedPlayerRightData.deaths)}`}
                          >
                            {selectedPlayerRightData.deaths}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 text-white font-medium">
                            K/D Ratio
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerLeftData.kdRatio, selectedPlayerRightData.kdRatio)}`}
                          >
                            {selectedPlayerLeftData.kdRatio?.toFixed(2) ||
                              "0.00"}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500">
                            —
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerRightData.kdRatio, selectedPlayerLeftData.kdRatio)}`}
                          >
                            {selectedPlayerRightData.kdRatio?.toFixed(2) ||
                              "0.00"}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 text-white font-medium">
                            Assists
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerLeftData.assists, selectedPlayerRightData.assists)}`}
                          >
                            {selectedPlayerLeftData.assists}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500">
                            —
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerRightData.assists, selectedPlayerLeftData.assists)}`}
                          >
                            {selectedPlayerRightData.assists}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 text-white font-medium">
                            Headshots %
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerLeftData.hsPercent || 0, selectedPlayerRightData.hsPercent || 0)}`}
                          >
                            {selectedPlayerLeftData.hsPercent?.toFixed(1) ||
                              "0.0"}
                            %
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500">
                            —
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerRightData.hsPercent || 0, selectedPlayerLeftData.hsPercent || 0)}`}
                          >
                            {selectedPlayerRightData.hsPercent?.toFixed(1) ||
                              "0.0"}
                            %
                          </td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-3 px-4 text-white font-medium">
                            Accuracy
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass((selectedPlayerLeftData.accuracy || 0) * 100, (selectedPlayerRightData.accuracy || 0) * 100)}`}
                          >
                            {(
                              (selectedPlayerLeftData.accuracy || 0) * 100
                            ).toFixed(1)}
                            %
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500">
                            —
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass((selectedPlayerRightData.accuracy || 0) * 100, (selectedPlayerLeftData.accuracy || 0) * 100)}`}
                          >
                            {(
                              (selectedPlayerRightData.accuracy || 0) * 100
                            ).toFixed(1)}
                            %
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-white font-medium">
                            Rating
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerLeftData.rating || 0, selectedPlayerRightData.rating || 0)}`}
                          >
                            {selectedPlayerLeftData.rating?.toFixed(2) ||
                              "0.00"}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500">
                            —
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${getStatComparisonClass(selectedPlayerRightData.rating || 0, selectedPlayerLeftData.rating || 0)}`}
                          >
                            {selectedPlayerRightData.rating?.toFixed(2) ||
                              "0.00"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* RATING BREAKDOWN TAB WITH CHARTS */}
          <TabsContent value="rating" className="space-y-6 mt-6">
            <RatingBreakdownChart
              players={players}
              teamAName={match.teamAName}
              teamBName={match.teamBName}
            />
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
                      onClick={() => setSelectedPlayerLeft(player.name)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedPlayerLeft === player.name
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
                {selectedPlayerLeftData ? (
                  <>
                    <Card className="border-slate-700 bg-gradient-to-br from-blue-500/20 to-slate-900/50 backdrop-blur">
                      <CardContent className="py-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                              {selectedPlayerLeftData.name}
                            </h3>
                            <p className="text-slate-400">
                              {selectedPlayerLeftData.team}
                            </p>
                          </div>
                          {selectedPlayerLeftData.fraudAssessment && (
                            <div
                              className={`text-right px-4 py-2 rounded-lg ${
                                selectedPlayerLeftData.fraudAssessment
                                  .fraudProbability > 70
                                  ? "bg-red-500/20 border border-red-500"
                                  : selectedPlayerLeftData.fraudAssessment
                                        .fraudProbability > 40
                                    ? "bg-yellow-500/20 border border-yellow-500"
                                    : "bg-green-500/20 border border-green-500"
                              }`}
                            >
                              <p className="text-xs text-slate-400 mb-1">
                                Fraud Risk
                              </p>
                              <p
                                className={`text-2xl font-bold ${
                                  selectedPlayerLeftData.fraudAssessment
                                    .fraudProbability > 70
                                    ? "text-red-400"
                                    : selectedPlayerLeftData.fraudAssessment
                                          .fraudProbability > 40
                                      ? "text-yellow-400"
                                      : "text-green-400"
                                }`}
                              >
                                {selectedPlayerLeftData.fraudAssessment.fraudProbability.toFixed(
                                  1,
                                )}
                                %
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Kills</p>
                            <p className="text-white font-bold text-xl">
                              {selectedPlayerLeftData.kills}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">
                              Deaths
                            </p>
                            <p className="text-white font-bold text-xl">
                              {selectedPlayerLeftData.deaths}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">K/D</p>
                            <p className="text-white font-bold text-xl">
                              {selectedPlayerLeftData.kdRatio?.toFixed(2) ||
                                "0.00"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">HS%</p>
                            <p className="text-white font-bold text-xl">
                              {selectedPlayerLeftData.hsPercent?.toFixed(1) ||
                                "0.0"}
                              %
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
                              {(
                                (selectedPlayerLeftData.accuracy || 0) * 100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Rating
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerLeftData.rating?.toFixed(2) ||
                                "0.00"}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Total Damage
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerLeftData.totalDamage || 0}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Avg Damage/Kill
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerLeftData.avgDamage}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Headshots
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerLeftData.headshots || 0}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Assists
                            </p>
                            <p className="text-white font-bold">
                              {selectedPlayerLeftData.assists}
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
                        {selectedPlayerLeftData.fraudAssessment ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-slate-400 text-xs mb-1">
                                  Aim Score
                                </p>
                                <p className="text-white font-bold">
                                  {selectedPlayerLeftData.fraudAssessment.aimScore?.toFixed(
                                    1,
                                  ) || "0.0"}
                                </p>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-slate-400 text-xs mb-1">
                                  Positioning
                                </p>
                                <p className="text-white font-bold">
                                  {selectedPlayerLeftData.fraudAssessment.positioningScore?.toFixed(
                                    1,
                                  ) || "0.0"}
                                </p>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-slate-400 text-xs mb-1">
                                  Reaction
                                </p>
                                <p className="text-white font-bold">
                                  {selectedPlayerLeftData.fraudAssessment.reactionScore?.toFixed(
                                    1,
                                  ) || "0.0"}
                                </p>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-slate-400 text-xs mb-1">
                                  Game Sense
                                </p>
                                <p className="text-white font-bold">
                                  {selectedPlayerLeftData.fraudAssessment.gameSenseScore?.toFixed(
                                    1,
                                  ) || "0.0"}
                                </p>
                              </div>
                            </div>

                            {selectedPlayerLeftData.fraudAssessment
                              .suspiciousActivities?.length > 0 && (
                              <div className="space-y-2 mt-4 pt-4 border-t border-slate-700">
                                <p className="text-white font-medium text-sm">
                                  Suspicious Indicators:
                                </p>
                                {selectedPlayerLeftData.fraudAssessment.suspiciousActivities.map(
                                  (activity: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-sm"
                                    >
                                      <p className="text-red-300 font-medium">
                                        {activity.description}
                                      </p>
                                      <p className="text-red-400 text-xs">
                                        Confidence:{" "}
                                        {activity.confidence?.toFixed(1) ||
                                          "0.0"}
                                        %
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}

                            <div
                              className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                                selectedPlayerLeftData.fraudAssessment
                                  .riskLevel === "critical"
                                  ? "bg-red-500/20 text-red-300 border border-red-500"
                                  : selectedPlayerLeftData.fraudAssessment
                                        .riskLevel === "high"
                                    ? "bg-orange-500/20 text-orange-300 border border-orange-500"
                                    : selectedPlayerLeftData.fraudAssessment
                                          .riskLevel === "medium"
                                      ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500"
                                      : "bg-green-500/20 text-green-300 border border-green-500"
                              }`}
                            >
                              Risk Level:{" "}
                              {selectedPlayerLeftData.fraudAssessment.riskLevel?.toUpperCase() ||
                                "UNKNOWN"}
                            </div>
                          </>
                        ) : (
                          <p className="text-slate-400">
                            No fraud assessment available
                          </p>
                        )}
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Podejrzane Klipy</h3>
              <Button
                onClick={() => setShowClipGenerator(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Generuj Klipy
              </Button>
            </div>

            {isGeneratingClips && (
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                  <p className="text-slate-400">
                    Generating clips... This may take several minutes
                  </p>
                </CardContent>
              </Card>
            )}

            {clips.length === 0 && !isGeneratingClips && (
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-slate-400 mb-2">
                    Brak klipów
                  </p>
                  <p className="text-slate-500 mb-4">
                    Nie ma jeszcze wygenerowanych podejrzanych klipów
                  </p>
                  <Button
                    onClick={() => setShowClipGenerator(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Generuj Klipy Teraz
                  </Button>
                </CardContent>
              </Card>
            )}

            {!selectedClip && clips.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clips.map((clip) => (
                  <Card
                    key={clip.id}
                    className="border-slate-700 bg-slate-900/50 backdrop-blur hover:border-slate-500 transition-colors cursor-pointer"
                    onClick={() => setSelectedClip(clip)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-video bg-slate-800 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-white font-medium text-sm mb-1">
                        {clip.id}
                      </p>
                      <p className="text-slate-400 text-xs mb-3">
                        {clip.sizeMB} MB
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-slate-700 text-xs"
                          onClick={() => setSelectedClip(clip)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Watch
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleDeleteClip(clip.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedClip && (
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-bold">{selectedClip.id}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700"
                      onClick={() => setSelectedClip(null)}
                    >
                      Close
                    </Button>
                  </div>
                  <VideoPlayer
                    videoPath={selectedClip.path}
                    clipId={selectedClip.id}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ClipGeneratorModal
        isOpen={showClipGenerator}
        matchId={matchId || ""}
        onClose={() => setShowClipGenerator(false)}
        onSuccess={() => {
          setShowClipGenerator(false);
          window.location.reload();
        }}
      />
    </Layout>
  );
}
