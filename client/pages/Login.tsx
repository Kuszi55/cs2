import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { playSound } from "@/lib/sounds";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      playSound("click");
    } catch (e) {
      // Sound might not be available in all browsers
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = login(username, password);
    if (!success) {
      setError("Invalid credentials. Please try again.");
      try {
        playSound("error");
      } catch (e) {
        // Sound might not be available in all browsers
      }
    } else {
      try {
        playSound("success");
      } catch (e) {
        // Sound might not be available in all browsers
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8 animate-slideInFromLeft">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 animate-glow">
            <span className="text-white font-bold text-lg">CS</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CS2 Analysis</h1>
          <p className="text-slate-400">Professional demo analysis platform</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl animate-slideInFromRight">
          <CardHeader className="space-y-1">
            <CardTitle className="text-white text-2xl">Welcome back</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  Username
                </label>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold h-10 transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          This is a secure admin-only platform for professional CS2 demo
          analysis
        </p>
      </div>
    </div>
  );
}
