import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clips from "./pages/Clips";
import Settings from "./pages/Settings";
import MatchStats from "./pages/MatchStats";
import MatchesHistory from "./pages/MatchesHistory";
import MatchDetails from "./pages/MatchDetails";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AnalyzeDemo from "./pages/AnalyzeDemo"; // ⬅️ nowy import

const queryClient = new QueryClient();

const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/" replace />;
};

const RootRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRoute />} />
    <Route
      path="/dashboard"
      element={<ProtectedRoute element={<Dashboard />} />}
    />
    <Route
      path="/match-stats"
      element={<ProtectedRoute element={<MatchStats />} />}
    />
    <Route
      path="/matches"
      element={<ProtectedRoute element={<MatchesHistory />} />}
    />
    <Route
      path="/match-details/:matchId"
      element={<ProtectedRoute element={<MatchDetails />} />}
    />
    <Route path="/clips" element={<ProtectedRoute element={<Clips />} />} />
    <Route
      path="/settings"
      element={<ProtectedRoute element={<Settings />} />}
    />

    {/* ⬇️ Nowa trasa AnalyzeDemo */}
    <Route
      path="/analyze-demo"
      element={<ProtectedRoute element={<AnalyzeDemo />} />}
    />

    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
