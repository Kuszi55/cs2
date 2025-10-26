import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, BarChart3, Zap, AlertTriangle } from "lucide-react";

interface DemoFile {
  name: string;
  size: number;
  uploadedAt: Date;
}

interface PlayerStat {
  name: string;
  kills: number;
  deaths: number;
  headshots: number;
  rating: number;
  cheatProbability: number;
}

export default function Dashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"upload" | "analysis">("upload");
  const [demoFile, setDemoFile] = useState<DemoFile | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock data for demonstration
  const mockPlayers: PlayerStat[] = [
    { name: "PlayerOne", kills: 24, deaths: 8, headshots: 12, rating: 1.45, cheatProbability: 45 },
    { name: "PlayerTwo", kills: 18, deaths: 12, headshots: 6, rating: 1.2, cheatProbability: 12 },
    { name: "PlayerThree", kills: 20, deaths: 10, headshots: 10, rating: 1.35, cheatProbability: 8 },
    { name: "PlayerFour", kills: 16, deaths: 14, headshots: 5, rating: 1.0, cheatProbability: 78 },
    { name: "PlayerFive", kills: 22, deaths: 9, headshots: 11, rating: 1.4, cheatProbability: 22 },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDemoFile({
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
      });
      setIsAnalyzing(true);
      setSelectedPlayer(null);

      // Simulate analysis
      setTimeout(() => {
        setIsAnalyzing(false);
        setActiveTab("analysis");
      }, 2000);
    }
  };

  return (
    <Layout onLogout={logout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-700 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Demo Analysis</h1>
          <p className="text-slate-400">Upload and analyze Counter-Strike 2 demo files for suspicious activity</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "upload"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Upload Demo
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            disabled={!demoFile}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "analysis"
                ? "text-blue-400 border-b-2 border-blue-400"
                : demoFile
                  ? "text-slate-400 hover:text-slate-300"
                  : "text-slate-600 cursor-not-allowed"
            }`}
          >
            Analysis Results
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  Upload Demo File
                </CardTitle>
                <CardDescription>Supported formats: .dem (Counter-Strike 2 demo files)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept=".dem"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="demo-upload"
                  />
                  <label htmlFor="demo-upload" className="cursor-pointer block">
                    <Upload className="w-12 h-12 text-slate-600 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                    <p className="text-white font-medium mb-1">Drop your demo file here</p>
                    <p className="text-slate-400 text-sm">or click to browse</p>
                  </label>
                </div>
              </CardContent>
            </Card>

            {demoFile && (
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Uploaded File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-white font-medium">{demoFile.name}</p>
                    <p className="text-slate-400 text-sm">{(demoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-slate-400 text-sm">{demoFile.uploadedAt.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === "analysis" && (
          <div className="space-y-4">
            {isAnalyzing ? (
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white font-medium">Analyzing demo file...</p>
                    <p className="text-slate-400 text-sm mt-2">This may take a moment</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Player Selection */}
                <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      Select Player to Analyze
                    </CardTitle>
                    <CardDescription>Choose a player to view detailed statistics and fraud probability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {mockPlayers.map((player) => (
                        <button
                          key={player.name}
                          onClick={() => setSelectedPlayer(player.name)}
                          className={`p-4 rounded-lg text-left transition-all ${
                            selectedPlayer === player.name
                              ? "bg-blue-500/20 border-2 border-blue-500"
                              : "bg-slate-800/50 border border-slate-700 hover:border-slate-600"
                          }`}
                        >
                          <p className="font-medium text-white">{player.name}</p>
                          <p className="text-slate-400 text-sm mt-1">K/D: {player.kills}/{player.deaths}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Player Analysis */}
                {selectedPlayer && (
                  <div className="space-y-4 animate-fadeIn">
                    {(() => {
                      const player = mockPlayers.find((p) => p.name === selectedPlayer);
                      return player ? (
                        <>
                          {/* Fraud Probability - Large Display */}
                          <Card className="border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur overflow-hidden">
                            <CardHeader>
                              <CardTitle className="text-white text-lg">Fraud Risk Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-6">
                                <div className="text-center py-6 bg-slate-900/50 rounded-lg">
                                  <div className="inline-flex items-end justify-center gap-1 mb-4">
                                    <span className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                      {player.cheatProbability}
                                    </span>
                                    <span className="text-2xl text-slate-400 mb-2">%</span>
                                  </div>
                                  <p className="text-slate-300 text-sm">Estimated fraud probability based on gameplay patterns</p>
                                </div>

                                {/* Risk Level Indicator */}
                                <div>
                                  <p className="text-slate-300 text-sm font-medium mb-3">Risk Level</p>
                                  <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        player.cheatProbability > 60
                                          ? "bg-red-500"
                                          : player.cheatProbability > 30
                                            ? "bg-yellow-500"
                                            : "bg-green-500"
                                      }`}
                                      style={{ width: `${player.cheatProbability}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                                    <span>Low</span>
                                    <span>Medium</span>
                                    <span>High</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Player Stats Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-slate-400 text-sm font-medium">K/D Ratio</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold text-white">
                                  {(player.kills / player.deaths).toFixed(2)}
                                </div>
                                <p className="text-slate-400 text-sm mt-1">
                                  {player.kills} Kills / {player.deaths} Deaths
                                </p>
                              </CardContent>
                            </Card>

                            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-slate-400 text-sm font-medium">Headshot %</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold text-white">
                                  {((player.headshots / player.kills) * 100).toFixed(1)}%
                                </div>
                                <p className="text-slate-400 text-sm mt-1">{player.headshots} headshots</p>
                              </CardContent>
                            </Card>

                            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-slate-400 text-sm font-medium">HLTV Rating</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold text-white">{player.rating.toFixed(2)}</div>
                                <p className="text-slate-400 text-sm mt-1">Performance rating</p>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Suspicious Indicators */}
                          {player.cheatProbability > 30 && (
                            <Card className="border-red-500/30 bg-red-500/10 backdrop-blur">
                              <CardHeader>
                                <CardTitle className="text-red-400 flex items-center gap-2 text-lg">
                                  <AlertTriangle className="w-5 h-5" />
                                  Suspicious Indicators
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2 text-red-200 text-sm">
                                  <li>• Abnormally high accuracy in difficult clutch situations</li>
                                  <li>• Consistent pre-fire patterns detected</li>
                                  <li>• Head-level crosshair placement in unexpected positions</li>
                                </ul>
                              </CardContent>
                            </Card>
                          )}
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
