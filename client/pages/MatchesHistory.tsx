import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Play, Map, Trophy, Loader2, AlertCircle, Trash2 } from "lucide-react";

interface Match {
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

export default function MatchesHistory() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/matches");
        const data = await response.json();

        if (data.success && data.matches) {
          setMatches(data.matches);
        } else {
          setError("Failed to load matches");
        }
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load match history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDeleteMatch = async (
    e: React.MouseEvent,
    matchId: number
  ) => {
    e.stopPropagation();

    if (!window.confirm("Czy na pewno chcesz usunąć ten mecz?")) {
      return;
    }

    try {
      setDeletingId(matchId);
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMatches(matches.filter((m) => m.id !== matchId));
        toast({
          title: "Sukces",
          description: "Mecz został usunięty",
        });
      } else {
        toast({
          title: "Błąd",
          description: "Nie udało się usunąć meczu",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting match:", err);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć meczu",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout onLogout={logout}>
      <div className="space-y-6">
        <div className="border-b border-slate-700 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Historia Meczów</h1>
          <p className="text-slate-400">
            Przeglądaj wszystkie wgrane i przeanalizowane mecze
          </p>
        </div>

        {isLoading ? (
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mr-3" />
              <p className="text-slate-400">Ładowanie meczów...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-500/30 bg-red-500/10 backdrop-blur">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        ) : matches.length === 0 ? (
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardContent className="text-center py-12">
              <History className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400 font-medium">Brak meczów</p>
              <p className="text-slate-500 text-sm mt-1">
                Wgraj plik demo aby zacząć
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Wgraj Demo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card
                key={match.id}
                className="border-slate-700 bg-slate-900/50 backdrop-blur hover:border-slate-600 transition-all cursor-pointer group"
                onClick={() => navigate(`/match-details/${match.id}`)}
              >
                <CardContent className="py-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Match Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Map className="w-5 h-5 text-blue-400" />
                        <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">
                          {match.mapName}
                        </h3>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded uppercase font-medium">
                          {match.gameMode}
                        </span>
                      </div>

                      {/* Teams and Score */}
                      <div className="flex items-center gap-4 mb-3 ml-8">
                        <div className="flex-1">
                          <p className="text-slate-400 text-sm">
                            {match.teamAName}
                          </p>
                          <p className="text-white font-bold text-lg">
                            {match.teamAScore}
                          </p>
                        </div>
                        <div className="text-slate-500 font-semibold">vs</div>
                        <div className="flex-1 text-right">
                          <p className="text-slate-400 text-sm">
                            {match.teamBName}
                          </p>
                          <p className="text-white font-bold text-lg">
                            {match.teamBScore}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 ml-8 text-sm">
                        <div className="text-slate-400">
                          Czas trwania:{" "}
                          <span className="text-white font-medium">
                            {formatDuration(match.duration)}
                          </span>
                        </div>
                        <div className="text-slate-400">
                          Wgrany:{" "}
                          <span className="text-white font-medium">
                            {formatDate(match.uploadedAt)}
                          </span>
                        </div>
                        <div className="text-slate-400">
                          Plik:{" "}
                          <span className="text-white font-medium truncate">
                            {match.demoFileName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-col md:flex-row">
                      <Button
                        onClick={() => navigate(`/match-details/${match.id}`)}
                        className="bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Analiza
                      </Button>
                      <Button
                        onClick={(e) => handleDeleteMatch(e, match.id)}
                        disabled={deletingId === match.id}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 whitespace-nowrap border border-red-500/30"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deletingId === match.id ? "Usuwanie..." : "Usuń"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
