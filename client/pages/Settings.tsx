import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Volume2, Zap } from "lucide-react";

export default function Settings() {
  const { logout } = useAuth();

  return (
    <Layout onLogout={logout}>
      <div className="space-y-6">
        <div className="border-b border-slate-700 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Customize your experience and platform preferences</p>
        </div>

        {/* Audio Settings */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-400" />
              Audio Settings
            </CardTitle>
            <CardDescription>Control notification sounds and audio feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <p className="text-white text-sm font-medium">Notification Sounds</p>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <p className="text-white text-sm font-medium">Analysis Complete Alert</p>
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
            <CardDescription>Control animations and visual effects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <p className="text-white text-sm font-medium">Enable Animations</p>
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
                <p className="text-white text-sm font-medium">Auto-save Analysis</p>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
