import { useState } from "react";
import { ReactNode } from "react";
import {
  BarChart3,
  Video,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  History,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", icon: BarChart3, path: "/dashboard" },
    { label: "Match Stats", icon: TrendingUp, path: "/match-stats" },
    { label: "Match History", icon: History, path: "/matches" },
    { label: "Clips", icon: Video, path: "/clips" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <span className="text-white font-bold text-xs">CS</span>
          </div>
          <span className="font-semibold text-white text-sm">CS2 Analysis</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform fixed md:relative w-64 h-screen bg-slate-900 border-r border-slate-700 flex flex-col z-40 md:z-10`}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-700 hidden md:block">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <span className="text-white font-bold">CS</span>
              </div>
              <div>
                <h1 className="font-bold text-white">CS2 Analysis</h1>
                <p className="text-xs text-slate-400">
                  Professional Demo Analyzer
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors text-sm font-medium"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-700">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-slate-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen overflow-auto">
          <div className="p-6 md:p-8 max-w-7xl">{children}</div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
