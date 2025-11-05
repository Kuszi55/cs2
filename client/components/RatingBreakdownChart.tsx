import React from "react";

interface RatingChartProps {
  players: any[];
  teamAName: string;
  teamBName: string;
}

export function RatingBreakdownChart({
  players,
  teamAName,
  teamBName,
}: RatingChartProps) {
  const teamAPlayers = players.filter((p) => p.team === teamAName);
  const teamBPlayers = players.filter((p) => p.team === teamBName);

  const teamAAvgRating =
    teamAPlayers.reduce((sum, p) => sum + (p.rating || 0), 0) /
      teamAPlayers.length || 0;
  const teamBAvgRating =
    teamBPlayers.reduce((sum, p) => sum + (p.rating || 0), 0) /
      teamBPlayers.length || 0;

  const getSampleMetrics = (team: string) => {
    const teamPlayers = players.filter((p) => p.team === team);
    const avgAccuracy =
      (teamPlayers.reduce((sum, p) => sum + (p.accuracy || 0), 0) /
        teamPlayers.length) *
      100;
    const avgHeadshot =
      teamPlayers.reduce((sum, p) => sum + (p.hsPercent || 0), 0) /
      teamPlayers.length;
    const avgKD =
      teamPlayers.reduce((sum, p) => sum + (p.kdRatio || 0), 0) /
      teamPlayers.length;

    return {
      aim: Math.min(avgAccuracy / 20, 100),
      positioning: 75 - avgHeadshot * 5,
      reaction: 80 + avgKD * 5,
      gameSense: Math.min(teamPlayers.length * 20, 100),
      consistency: 85 - Math.random() * 20,
    };
  };

  const metricsA = getSampleMetrics(teamAName);
  const metricsB = getSampleMetrics(teamBName);
  const metrics = ["Aim", "Positioning", "Reaction", "Game Sense", "Consistency"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-white font-bold mb-2">{teamAName}</h3>
          <p className="text-3xl font-bold text-blue-400">
            {teamAAvgRating.toFixed(2)}
          </p>
          <p className="text-slate-400 text-sm">Average Rating</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-white font-bold mb-2">{teamBName}</h3>
          <p className="text-3xl font-bold text-red-400">
            {teamBAvgRating.toFixed(2)}
          </p>
          <p className="text-slate-400 text-sm">Average Rating</p>
        </div>
      </div>

      {/* Metrics Comparison Table */}
      <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700 overflow-x-auto">
        <h3 className="text-white font-bold mb-4">Team Metrics Comparison</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-slate-400 font-medium">
                Metric
              </th>
              <th className="text-center py-3 px-4 text-blue-400 font-medium">
                {teamAName}
              </th>
              <th className="text-center py-3 px-4 text-slate-500">vs</th>
              <th className="text-center py-3 px-4 text-red-400 font-medium">
                {teamBName}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-700">
              <td className="py-3 px-4 text-white font-medium">Aim</td>
              <td
                className={`py-3 px-4 text-center font-bold ${metricA.aim > metricB.aim ? "text-green-400" : "text-slate-300"}`}
              >
                {metricA.aim.toFixed(1)}
              </td>
              <td className="py-3 px-4 text-center text-slate-500">—</td>
              <td
                className={`py-3 px-4 text-center font-bold ${metricB.aim > metricA.aim ? "text-green-400" : "text-slate-300"}`}
              >
                {metricB.aim.toFixed(1)}
              </td>
            </tr>
            <tr className="border-b border-slate-700">
              <td className="py-3 px-4 text-white font-medium">Positioning</td>
              <td
                className={`py-3 px-4 text-center font-bold ${metricA.positioning > metricB.positioning ? "text-green-400" : "text-slate-300"}`}
              >
                {metricA.positioning.toFixed(1)}
              </td>
              <td className="py-3 px-4 text-center text-slate-500">—</td>
              <td
                className={`py-3 px-4 text-center font-bold ${metricB.positioning > metricA.positioning ? "text-green-400" : "text-slate-300"}`}
              >
                {metricB.positioning.toFixed(1)}
              </td>
            </tr>
            <tr className="border-b border-slate-700">
              <td className="py-3 px-4 text-white font-medium">Reaction</td>
              <td
                className={`py-3 px-4 text-center font-bold ${metricA.reaction > metricB.reaction ? "text-green-400" : "text-slate-300"}`}
              >
                {metricA.reaction.toFixed(1)}
              </td>
              <td className="py-3 px-4 text-center text-slate-500">—</td>
              <td
                className={`py-3 px-4 text-center font-bold ${metricB.reaction > metricA.reaction ? "text-green-400" : "text-slate-300"}`}
              >
                {metricB.reaction.toFixed(1)}
              </td>
            </tr>
            <tr className="border-b border-slate-700">
              <td className="py-3 px-4 text-white font-medium">Game Sense</td>
              <td
                className={`py-3 px-4 text-center font-bold ${metricA.gameSense > metricB.gameSense ? "text-green-400" : "text-slate-300"}`}
              >
                {metricA.gameSense.toFixed(1)}
              </td>
              <td className="py-3 px-4 text-center text-slate-500">—</td>
              <td
                className={`py-3 px-4 text-center font-bold ${metricB.gameSense > metricA.gameSense ? "text-green-400" : "text-slate-300"}`}
              >
                {metricB.gameSense.toFixed(1)}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-white font-medium">Consistency</td>
              <td
                className={`py-3 px-4 text-center font-bold ${metricA.consistency > metricB.consistency ? "text-green-400" : "text-slate-300"}`}
              >
                {metricA.consistency.toFixed(1)}
              </td>
              <td className="py-3 px-4 text-center text-slate-500">—</td>
              <td
                className={`py-3 px-4 text-center font-bold ${metricB.consistency > metricA.consistency ? "text-green-400" : "text-slate-300"}`}
              >
                {metricB.consistency.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual Metric Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { team: teamAName, metrics: metricA },
          { team: teamBName, metrics: metricB },
        ].map(({ team, metrics }) => (
          <div
            key={team}
            className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
          >
            <h4 className="text-white font-bold mb-4">{team}</h4>
            <div className="space-y-3">
              {[
                { label: "Aim", value: metrics.aim },
                { label: "Positioning", value: metrics.positioning },
                { label: "Reaction", value: metrics.reaction },
                { label: "Game Sense", value: metrics.gameSense },
                { label: "Consistency", value: metrics.consistency },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 text-sm">{label}</span>
                    <span className="text-white font-bold text-sm">
                      {value.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        team === teamAName
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Top Players */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[teamAName, teamBName].map((team) => {
          const teamPlayers = players.filter((p) => p.team === team);
          return (
            <div
              key={team}
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
            >
              <h4 className="text-white font-bold mb-4">{team} - Top Rated</h4>
              <div className="space-y-2">
                {teamPlayers
                  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                  .slice(0, 5)
                  .map((player) => (
                    <div
                      key={player.name}
                      className="flex justify-between items-center p-2 bg-slate-800/50 rounded"
                    >
                      <span className="text-slate-300 text-sm">
                        {player.name}
                      </span>
                      <span className="text-white font-bold">
                        {player.rating?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
