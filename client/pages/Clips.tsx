import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Play } from "lucide-react";

export default function Clips() {
  const { logout } = useAuth();

  return (
    <Layout onLogout={logout}>
      <div className="space-y-6">
        <div className="border-b border-slate-700 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Saved Clips</h1>
          <p className="text-slate-400">View and manage your recorded suspicious moments from analyzed demos</p>
        </div>

        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-400" />
              Your Clips
            </CardTitle>
            <CardDescription>Clips are saved when you enable recording during demo analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Empty state */}
              <div className="col-span-full text-center py-12">
                <Play className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 font-medium">No clips saved yet</p>
                <p className="text-slate-500 text-sm mt-1">Start analyzing demos to save suspicious clips</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
