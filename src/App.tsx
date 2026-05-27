import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AIProvider } from "@/contexts/AIContext";
import ErrorBoundary from "@/components/EchoPrompt/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MyPrompts from "./pages/MyPrompts";
import MyTemplates from "./pages/MyTemplates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Force dark theme on app initialization
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('dark');
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AIProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/my-prompts"
                  element={
                    <ProtectedRoute>
                      <MyPrompts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-templates"
                  element={
                    <ProtectedRoute>
                      <MyTemplates />
                    </ProtectedRoute>
                  }
                />
                {/* Redirect old library URL to home */}
                <Route path="/library" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AIProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
