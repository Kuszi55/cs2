import { useEffect, useState } from "react";
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
  Settings as SettingsIcon,
  Volume2,
  Zap,
  Trash2,
  Loader2,
  AlertTriangle,
  Database,
} from "lucide-react";

export default function Settings() {
  const { logout, user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  const isAdmin = user?.username === "ADMIN2137";

  useEffect(() => {
    if (isAdmin) {
      loadMatches();
    }
  }, [isAdmin]);

  const loadMatches = async () => {
    try {
      setIsLoadingMatches(true);
      const response = await fetch("/api/matches");
      const data = await response.json();

      if (data.success && Array.isArray(data.matches)) {
        setMatches(data.matches);
        calculateStorage(data.matches);
      }
    } catch (err) {
      console.error("Error loading matches:", err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const calculateStorage = (matchesList: any[]) => {
    let totalSize = 0;
    let totalClips = 0;

    matchesList.forEach((match) => {
      if (match.clipCount) totalClips += match.clipCount;
      if (match.clipsSize) totalSize += match.clipsSize;
    });

    setStorageInfo({
      totalMatches: matchesList.length,
      totalClips,
      totalSizeGB: (totalSize / 1024 / 1024 / 1024).toFixed(2),
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    });
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure? This will delete the match and all its clips.")) {
      return;
    }

    try {
      setDeletingMatchId(matchId);
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMatches(matches.filter((m) => m.id !== matchId));
      } else {
        alert("Failed to delete match");
      }
    } catch (err) {
      console.error("Error deleting match:", err);
      alert("Error deleting match");
    } finally {
      setDeletingMatchId(null);
    }
  };

  const handleDeleteAllClips = async (matchId: string) => {
    if (!confirm("Are you sure? This will delete all clips for this match.")) {
      return;
    }

    try {
      const response = await fetch(`/api/clips/${matchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadMatches();
      } else {
        alert("Failed to delete clips");
      }
    } catch (err) {
      console.error("Error deleting clips:", err);
      alert("Error deleting clips");
    }
  };

  return (
    <Layout onLogout={logout}>
      <div className="space-y-6">
        <div className="border-b border-slate-700 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">
            Customize your experience and platform preferences
          </p>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <>
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 mb-6">
              <p className="text-purple-300 text-sm font-medium">
                🔐 ADMIN PANEL - Matches & Clips Management
              </p>
            </div>

            {storageInfo && (
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    Storage Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-1">Matches</p>
                      <p className="text-white font-bold text-2xl">
                        {storageInfo.totalMatches}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-1">Total Clips</p>
                      <p className="text-white font-bold text-2xl">
                        {storageInfo.totalClips}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-1">
                        Storage (MB)
                      </p>
                      <p className="text-white font-bold text-2xl">
                        {storageInfo.totalSizeMB}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-1">
                        Storage (GB)
                      </p>
                      <p className="text-white font-bold text-2xl">
                        {storageInfo.totalSizeGB}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Match Management</CardTitle>
                  <CardDescription>
                    View and delete matches and their associated clips
                  </CardDescription>
                </div>
                <Button
                  onClick={loadMatches}
                  disabled={isLoadingMatches}
                  variant="outline"
                  className="border-slate-700"
                >
                  {isLoadingMatches ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400">No matches found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">
                            Match ID
                          </th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">
                            Teams
                          </th>
                          <th className="text-center py-3 px-4 text-slate-400 font-medium">
                            Score
                          </th>
                          <th className="text-center py-3 px-4 text-slate-400 font-medium">
                            Map
                          </th>
                          <th className="text-center py-3 px-4 text-slate-400 font-medium">
                            Clips
                          </th>
                          <th className="text-center py-3 px-4 text-slate-400 font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map((match) => (
                          <tr
                            key={match.id}
                            className="border-b border-slate-700 hover:bg-slate-800/30"
                          >
                            <td className="py-3 px-4 text-white font-medium">
                              #{match.id}
                            </td>
                            <td className="py-3 px-4 text-slate-300 text-sm">
                              {match.teamAName} vs {match.teamBName}
                            </td>
                            <td className="py-3 px-4 text-center text-white font-bold">
                              {match.teamAScore}:{match.teamBScore}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-300">
                              {match.mapName}
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {match.clipCount || 0}
                            </td>
                            <td className="py-3 px-4 text-center space-x-2">
                              {match.clipCount > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20 text-xs"
                                  onClick={() => handleDeleteAllClips(match.id)}
                                >
                                  Clear Clips
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/20 text-xs"
                                disabled={deletingMatchId === match.id}
                                onClick={() => handleDeleteMatch(match.id)}
                              >
                                {deletingMatchId === match.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Audio Settings */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-400" />
              Audio Settings
            </CardTitle>
            <CardDescription>
              Control notification sounds and audio feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <p className="text-white text-sm font-medium">
                  Notification Sounds
                </p>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <p className="text-white text-sm font-medium">
                  Analysis Complete Alert
                </p>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Settings */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Visual Settings
            </CardTitle>
            <CardDescription>
              Control animations and visual effects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <p className="text-white text-sm font-medium">
                  Enable Animations
                </p>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <p className="text-white text-sm font-medium">Reduce Motion</p>
                <input type="checkbox" className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-blue-400" />
              Account Settings
            </CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <p className="text-white text-sm font-medium">Advanced Mode</p>
                <input type="checkbox" className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <p className="text-white text-sm font-medium">
                  Auto-save Analysis
                </p>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
