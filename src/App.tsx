import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AuthProvider } from "./hooks/useAuth";
import { AdminModeProvider } from "./hooks/useAdminMode";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import HomeMenu from "./pages/HomeMenu";
import Profile from "./pages/Profile";
import MyDashboard from "./pages/MyDashboard";
import Dashboard from "./pages/Dashboard";
import DashboardAISummary from "./pages/dashboard/DashboardAISummary";
import DashboardAchievements from "./pages/dashboard/DashboardAchievements";
import DashboardHabits from "./pages/dashboard/DashboardHabits";
import DashboardPsychological from "./pages/dashboard/DashboardPsychological";
import DashboardLongevity from "./pages/dashboard/DashboardLongevity";
import DashboardBodyComposition from "./pages/dashboard/DashboardBodyComposition";
import DashboardMetabolic from "./pages/dashboard/DashboardMetabolic";
import Tests from "./pages/Tests";
import AppointmentsNew from "./pages/AppointmentsNew";
import FindProfessionals from "./pages/FindProfessionals";
import ProfessionalMode from "./pages/ProfessionalMode";
import ProfessionalDemoPage from "./pages/ProfessionalDemoPage";
import ProfessionalHistory from "./pages/ProfessionalHistory";
import ProfessionalClinicalHistory from "./pages/ProfessionalClinicalHistory";
import Reminders from "./pages/Reminders";
import Admin from "./pages/Admin";
import AdminSelectPatient from "./pages/AdminSelectPatient";
import NotificationSettings from "./pages/NotificationSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Detect if running as native app
const isNativeApp = Capacitor.isNativePlatform();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Landing page - only for web, native goes to auth */}
              <Route path="/" element={isNativeApp ? <Navigate to="/auth" replace /> : <Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* New home menu - protected, first page after login */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <HomeMenu />
                </ProtectedRoute>
              } />
              
              {/* Profile page */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* My Dashboard menu */}
              <Route path="/my-dashboard" element={
                <ProtectedRoute>
                  <MyDashboard />
                </ProtectedRoute>
              } />
              
              {/* Dashboard sub-pages */}
              <Route path="/dashboard/ai-summary" element={
                <ProtectedRoute>
                  <DashboardAISummary />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/achievements" element={
                <ProtectedRoute>
                  <DashboardAchievements />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/habits" element={
                <ProtectedRoute>
                  <DashboardHabits />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/psychological" element={
                <ProtectedRoute>
                  <DashboardPsychological />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/longevity" element={
                <ProtectedRoute>
                  <DashboardLongevity />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/body-composition" element={
                <ProtectedRoute>
                  <DashboardBodyComposition />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/metabolic" element={
                <ProtectedRoute>
                  <DashboardMetabolic />
                </ProtectedRoute>
              } />
              
              {/* Legacy dashboard route */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* Appointments with dropdowns */}
              <Route path="/appointments" element={<AppointmentsNew />} />
              
              {/* Find professionals */}
              <Route path="/find-professionals" element={
                <ProtectedRoute>
                  <FindProfessionals />
                </ProtectedRoute>
              } />
              
              {/* Professional mode */}
              <Route path="/professional" element={
                <ProtectedRoute>
                  <ProfessionalMode />
                </ProtectedRoute>
              } />
              {/* Professional demo (no auth required) */}
              <Route path="/demo/professional" element={<ProfessionalDemoPage />} />
              <Route path="/professional/history" element={
                <ProtectedRoute>
                  <ProfessionalHistory />
                </ProtectedRoute>
              } />
              <Route path="/professional/clinical-history" element={
                <ProtectedRoute>
                  <ProfessionalClinicalHistory />
                </ProtectedRoute>
              } />
              
              {/* Tests */}
              <Route path="/tests" element={
                <ProtectedRoute>
                  <Tests />
                </ProtectedRoute>
              } />
              
              {/* Reminders */}
              <Route path="/reminders" element={
                <ProtectedRoute>
                  <Reminders />
                </ProtectedRoute>
              } />
              
              {/* Notification settings */}
              <Route path="/notification-settings" element={
                <ProtectedRoute>
                  <NotificationSettings />
                </ProtectedRoute>
              } />
              <Route path="/settings/notifications" element={
                <ProtectedRoute>
                  <NotificationSettings />
                </ProtectedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/admin/select-patient" element={
                <ProtectedRoute requireAdmin>
                  <AdminSelectPatient />
                </ProtectedRoute>
              } />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AdminModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
