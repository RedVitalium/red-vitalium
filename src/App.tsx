import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tests from "./pages/Tests";
import Appointments from "./pages/Appointments";
import Reminders from "./pages/Reminders";
import Admin from "./pages/Admin";
import NotificationSettings from "./pages/NotificationSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Detect if running as native app
const isNativeApp = Capacitor.isNativePlatform();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Native app goes directly to auth, web shows landing page */}
            <Route path="/" element={isNativeApp ? <Navigate to="/auth" replace /> : <Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/tests" element={
                <ProtectedRoute>
                  <Tests />
                </ProtectedRoute>
              } />
              <Route path="/appointments" element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              } />
              <Route path="/reminders" element={
                <ProtectedRoute>
                  <Reminders />
                </ProtectedRoute>
              } />
              <Route path="/settings/notifications" element={
                <ProtectedRoute>
                  <NotificationSettings />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
