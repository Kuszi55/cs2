import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, Users, Trophy, AlertTriangle } from "lucide-react";

interface MatchPlayer {
  name: string;
  team: string;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  plants: number;
  defuses: number;
  cheatProbability: number;
}

export default function MatchStats() {
  const { logout } = useAuth();

  const mockPlayers: MatchPlayer[] = [
    {
      name: "PlayerOne",
      team: "Team A",
      kills: 24,
      deaths: 8,
      assists: 6,
      damage: 2350,
      plants: 2,
      defuses: 0,
      cheatProbability: 45,
    },
    {
      name: "PlayerTwo",
      team: "Team A",
      kills: 18,
      deaths: 12,
      assists: 7,
      damage: 1890,
      plants: 1,
      defuses: 2,
      cheatProbability: 12,
    },
    {
      name: "PlayerThree",
      team: "Team A",
      kills: 20,
      deaths: 10,
      assists: 5,
      damage: 2100,
      plants: 0,
      defuses: 3,
      cheatProbability: 8,
    },
    {
      name: "PlayerFour",
      team: "Team B",
      kills: 16,
      deaths: 14,
      assists: 4,
      damage: 1650,
      plants: 3,
      defuses: 1,
      cheatProbability: 78,
    },
    {
      name: "PlayerFive",
      team: "Team B",
      kills: 22,
      deaths: 9,
      assists: 8,
      damage: 2280,
      plants: 1,
      defuses: 0,
      cheatProbability: 22,
    },
  ];

  return (
    <Layout onLogout={logout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-700 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Match Statistics
          </h1>
          <p className="text-slate-400">
            Detailed performance metrics and fraud analysis for all players in
            the match
          </p>
        </div>

        {/* Match Info */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-400" />
              Match Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Map</p>
                <p className="text-white font-semibold">Mirage</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Score</p>
                <p className="text-white font-semibold">16 - 14</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Duration</p>
                <p className="text-white font-semibold">45 min 32 sec</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Demo Date</p>
                <p className="text-white font-semibold">2024-01-15</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Stats Comparison */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Team Comparison
            </CardTitle>
            <CardDescription>
              Aggregated statistics for each team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["Team A", "Team B"].map((team) => {
                const teamPlayers = mockPlayers.filter((p) => p.team === team);
                const totalKills = teamPlayers.reduce(
                  (sum, p) => sum + p.kills,
                  0,
                );
                const totalDeaths = teamPlayers.reduce(
                  (sum, p) => sum + p.deaths,
                  0,
                );
                const avgCheat = Math.round(
                  teamPlayers.reduce((sum, p) => sum + p.cheatProbability, 0) /
                    teamPlayers.length,
                );

                return (
                  <div
                    key={team}
                    className="bg-slate-800/50 rounded-lg p-4 space-y-3"
                  >
                    <p className="text-white font-semibold">{team}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Kills</span>
                        <span className="text-white font-medium">
                          {totalKills}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Deaths</span>
                        <span className="text-white font-medium">
                          {totalDeaths}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Avg Fraud Probability
                        </span>
                        <span
                          className={`font-medium ${avgCheat > 50 ? "text-red-400" : "text-green-400"}`}
                        >
                          {avgCheat}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Player Stats Table */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Player Performance
            </CardTitle>
            <CardDescription>
              Detailed statistics with fraud probability assessment
            </CardDescription>
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
                      K/D
                    </th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">
                      Assists
                    </th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">
                      Damage
                    </th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">
                      Plants
                    </th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">
                      Defuses
                    </th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">
                      Fraud Risk
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockPlayers.map((player) => (
                    <tr
                      key={player.name}
                      className="border-b border-slate-700 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">
                            {player.name}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {player.team}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-white">
                        {player.kills}/{player.deaths}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {player.assists}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {player.damage}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {player.plants}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {player.defuses}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {player.cheatProbability > 50 && (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          )}
                          <span
                            className={`font-medium ${
                              player.cheatProbability > 50
                                ? "text-red-400"
                                : player.cheatProbability > 20
                                  ? "text-yellow-400"
                                  : "text-green-400"
                            }`}
                          >
                            {player.cheatProbability}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* High Risk Indicators */}
        <Card className="border-red-500/30 bg-red-500/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Players Requiring Investigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockPlayers
                .filter((p) => p.cheatProbability > 50)
                .map((player) => (
                  <div
                    key={player.name}
                    className="p-3 bg-slate-900/50 rounded-lg border border-red-500/20"
                  >
                    <p className="text-white font-medium">{player.name}</p>
                    <p className="text-red-300 text-sm mt-1">
                      Fraud probability: {player.cheatProbability}%
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
