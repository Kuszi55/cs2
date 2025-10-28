import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  mapName: string;
  gameMode: string;
  teamAScore: number;
  teamBScore: number;
  players: PlayerAnalysis[];
  fraudAssessments: FraudAssessment[];
}

interface PlayerAnalysis {
  name: string;
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
  rating: number;
}

interface FraudAssessment {
  playerName: string;
  fraudProbability: number;
  aimScore: number;
  positioningScore: number;
  reactionScore: number;
  riskLevel: string;
  suspiciousActivities: SuspiciousActivity[];
}

interface SuspiciousActivity {
  type: string;
  confidence: number;
  description: string;
}

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"upload" | "analysis">("upload");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [gameMode, setGameMode] = useState<string>("");
  const [currentMatchId, setCurrentMatchId] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".dem")) {
      toast({
        title: "Nieprawidłowy format pliku",
        description: "Proszę wgraj plik .dem",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setUploadProgress(0);
    setSelectedPlayer(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 50;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          try {
            setUploadProgress(75);
            const response = JSON.parse(xhr.responseText);
            const result: AnalysisResult = response.analysis;
            const matchId = response.matchId;

            setAnalysisResult(result);
            setGameMode(result.gameMode);
            setCurrentMatchId(matchId);
            setUploadProgress(100);
            setActiveTab("analysis");

            toast({
              title: "Analiza zakończona!",
              description: `Demo przeanalizowano: ${result.mapName} (${result.gameMode})`,
            });
          } catch (error) {
            console.error("Parse error:", error);
            setIsAnalyzing(false);
            toast({
              title: "Błąd",
              description: "Nie udało się sparsować wyników analizy",
              variant: "destructive",
            });
          }
        } else {
          const errorResponse = JSON.parse(xhr.responseText);
          setIsAnalyzing(false);
          toast({
            title: "Analiza nie powiodła się",
            description: errorResponse.error || "Nie udało się przeanalizować dema",
            variant: "destructive",
          });
        }
      });

      xhr.addEventListener("error", () => {
        setIsAnalyzing(false);
        toast({
          title: "Wgranie nie powiodło się",
          description: "Błąd sieciowy podczas wgrania",
          variant: "destructive",
        });
      });

      xhr.open("POST", "/api/analyze/upload");
      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      setIsAnalyzing(false);
      toast({
        title: "Błąd",
        description: "Nie udało się wgrać pliku demo",
        variant: "destructive",
      });
    }
  };

  const selectedPlayerData = analysisResult?.players.find(
    (p) => p.name === selectedPlayer,
  );
  const selectedPlayerFraud = analysisResult?.fraudAssessments.find(
    (f) => f.playerName === selectedPlayer,
  );

  return (
    <Layout onLogout={logout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-700 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Analiza Demo</h1>
          <p className="text-slate-400">
            Wgraj pliki demo CS2 do zaawansowanego wykrywania i analizy oszustw
          </p>
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
            Wgraj Demo
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            disabled={!analysisResult}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "analysis"
                ? "text-blue-400 border-b-2 border-blue-400"
                : analysisResult
                  ? "text-slate-400 hover:text-slate-300"
                  : "text-slate-600 cursor-not-allowed"
            }`}
          >
            Wyniki Analizy
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  Wgraj Plik Demo
                </CardTitle>
                <CardDescription>
                  Obsługiwane formaty: .dem (Pliki demo Counter-Strike 2)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept=".dem"
                    onChange={handleFileUpload}
                    disabled={isAnalyzing}
                    className="hidden"
                    id="demo-upload"
                  />
                  <label htmlFor="demo-upload" className="cursor-pointer block">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-spin" />
                        <p className="text-white font-medium mb-1">
                          Analizowanie dema...
                        </p>
                        <p className="text-slate-400 text-sm">
                          {Math.round(uploadProgress)}% ukończone
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-slate-600 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                        <p className="text-white font-medium mb-1">
                          Przeciągnij plik demo tutaj
                        </p>
                        <p className="text-slate-400 text-sm">
                          lub kliknij aby przeglądać
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {isAnalyzing && (
                  <div className="mt-4">
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === "analysis" && analysisResult && (
          <div className="space-y-4">
            {/* Match Info */}
            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Informacje o Meczu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Mapa</p>
                    <p className="text-white font-semibold">
                      {analysisResult.mapName}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Tryb Gry</p>
                    <p className="text-white font-semibold uppercase">
                      {analysisResult.gameMode}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Wynik</p>
                    <p className="text-white font-semibold">
                      {analysisResult.teamAScore} - {analysisResult.teamBScore}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Gracze</p>
                    <p className="text-white font-semibold">
                      {analysisResult.players.length} graczy
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Player Selection */}
            {!selectedPlayer ? (
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Select Player to Analyze
                  </CardTitle>
                  <CardDescription>
                    Choose a player to view detailed statistics and fraud
                    assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {analysisResult.players.map((player) => {
                      const fraud = analysisResult.fraudAssessments.find(
                        (f) => f.playerName === player.name,
                      );
                      return (
                        <button
                          key={player.name}
                          onClick={() => setSelectedPlayer(player.name)}
                          className="p-4 rounded-lg text-left transition-all bg-slate-800/50 border border-slate-700 hover:border-slate-600 hover:bg-slate-800/70"
                        >
                          <p className="font-medium text-white text-sm">
                            {player.name}
                          </p>
                          <p className="text-slate-400 text-xs mt-1">
                            K/D: {player.kdRatio.toFixed(2)}
                          </p>
                          <p className="text-slate-400 text-xs mt-1">
                            Fraud:{" "}
                            <span
                              className={
                                fraud?.fraudProbability! > 50
                                  ? "text-red-400"
                                  : "text-green-400"
                              }
                            >
                              {fraud?.fraudProbability?.toFixed(0)}%
                            </span>
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : selectedPlayerData && selectedPlayerFraud ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Back Button */}
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors mb-2"
                >
                  ← Back to player list
                </button>

                {/* Fraud Probability */}
                <Card className="border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">
                      Fraud Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center py-6 bg-slate-900/50 rounded-lg">
                        <div className="inline-flex items-end justify-center gap-1 mb-4">
                          <span className="text-6xl font-bold gradient-text">
                            {selectedPlayerFraud.fraudProbability.toFixed(1)}
                          </span>
                          <span className="text-2xl text-slate-400 mb-2">
                            %
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">
                          Estimated fraud probability based on gameplay analysis
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-300 text-sm font-medium mb-3">
                          Risk Level
                        </p>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              selectedPlayerFraud.fraudProbability > 60
                                ? "bg-red-500"
                                : selectedPlayerFraud.fraudProbability > 30
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${selectedPlayerFraud.fraudProbability}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-400">
                          <span>Low</span>
                          <span>Medium</span>
                          <span>High</span>
                          <span>Critical</span>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs mb-1">
                            Aim Score
                          </p>
                          <p className="text-white font-semibold">
                            {selectedPlayerFraud.aimScore.toFixed(0)}%
                          </p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs mb-1">
                            Positioning
                          </p>
                          <p className="text-white font-semibold">
                            {selectedPlayerFraud.positioningScore.toFixed(0)}%
                          </p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs mb-1">
                            Reaction Time
                          </p>
                          <p className="text-white font-semibold">
                            {selectedPlayerFraud.reactionScore.toFixed(0)}%
                          </p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs mb-1">
                            Risk Level
                          </p>
                          <p
                            className={`font-semibold text-xs uppercase ${
                              selectedPlayerFraud.riskLevel === "critical"
                                ? "text-red-400"
                                : selectedPlayerFraud.riskLevel === "high"
                                  ? "text-orange-400"
                                  : selectedPlayerFraud.riskLevel === "medium"
                                    ? "text-yellow-400"
                                    : "text-green-400"
                            }`}
                          >
                            {selectedPlayerFraud.riskLevel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Player Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-slate-400 text-sm font-medium">
                        K/D Ratio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {selectedPlayerData.kdRatio.toFixed(2)}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        {selectedPlayerData.kills} Kills /{" "}
                        {selectedPlayerData.deaths} Deaths
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-slate-400 text-sm font-medium">
                        Accuracy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {(selectedPlayerData.accuracy * 100).toFixed(1)}%
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        Overall shot accuracy
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-slate-400 text-sm font-medium">
                        Headshot Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {selectedPlayerData.hsPercent.toFixed(1)}%
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        {selectedPlayerData.headshots} headshots
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-slate-400 text-sm font-medium">
                        Damage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {selectedPlayerData.totalDamage}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        {selectedPlayerData.avgDamage.toFixed(1)} per round
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-slate-400 text-sm font-medium">
                        Rating
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {selectedPlayerData.rating.toFixed(2)}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        HLTV Performance Rating
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-slate-400 text-sm font-medium">
                        Assists
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {selectedPlayerData.assists}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        Total assists
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Suspicious Activities */}
                {selectedPlayerFraud.suspiciousActivities.length > 0 && (
                  <Card className="border-red-500/30 bg-red-500/10 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Suspicious Indicators (
                        {selectedPlayerFraud.suspiciousActivities.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedPlayerFraud.suspiciousActivities.map(
                          (activity, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-900/50 rounded-lg border border-red-500/20"
                            >
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <p className="text-white font-medium text-sm capitalize">
                                  {activity.type.replace(/_/g, " ")}
                                </p>
                                <span className="text-red-400 text-sm font-semibold">
                                  {activity.confidence.toFixed(0)}%
                                </span>
                              </div>
                              <p className="text-red-200 text-xs">
                                {activity.description}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* View Match Stats Button */}
                <div className="flex gap-3">
                  {currentMatchId && (
                    <Button
                      onClick={() =>
                        navigate(`/match-details/${currentMatchId}`)
                      }
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Full Match Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate("/matches")}
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-300 hover:text-white"
                  >
                    View All Matches
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Layout>
  );
}
