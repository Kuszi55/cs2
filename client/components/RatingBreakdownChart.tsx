import React from "react";
import Chart from "react-apexcharts";

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

  const chartOptions = {
    chart: {
      type: "radar" as const,
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    stroke: {
      show: true,
      curve: "smooth" as const,
      lineCap: "butt" as const,
      colors: ["#3b82f6", "#ef4444"],
      width: 2,
      dashArray: 0,
    },
    fill: {
      opacity: 0.15,
    },
    plotOptions: {
      radar: {
        size: 140,
        polygons: {
          strokeColors: "#4b5563",
          fill: {
            colors: ["#1e293b", "#334155"],
          },
        },
      },
    },
    colors: ["#3b82f6", "#ef4444"],
    xaxis: {
      categories: ["Aim", "Position", "Reaction", "Game Sense", "Consistency"],
      labels: {
        show: true,
        style: {
          colors: "#94a3b8",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      show: true,
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "11px",
        },
      },
    },
    legend: {
      show: true,
      floating: true,
      fontSize: "14px",
      position: "bottom" as const,
      labels: {
        colors: "#cbd5e1",
      },
    },
    tooltip: {
      enabled: true,
      theme: "dark",
      style: {
        fontSize: "12px",
      },
    },
  };

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

    return [
      Math.min(avgAccuracy / 20, 100),
      75 - avgHeadshot * 5,
      80 + avgKD * 5,
      Math.min(teamPlayers.length * 20, 100),
      85 - Math.random() * 20,
    ];
  };

  const seriesData = [
    {
      name: teamAName,
      data: getSampleMetrics(teamAName),
    },
    {
      name: teamBName,
      data: getSampleMetrics(teamBName),
    },
  ];

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

      <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700 overflow-x-auto">
        <Chart
          options={chartOptions}
          series={seriesData}
          type="radar"
          height={400}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[teamAName, teamBName].map((team) => {
          const teamPlayers = players.filter((p) => p.team === team);
          return (
            <div
              key={team}
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
            >
              <h4 className="text-white font-bold mb-4">{team} - Player Ratings</h4>
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
