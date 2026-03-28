import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./hooks/useAuth";
import { AdminModeProvider } from "./hooks/useAdminMode";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Static imports (always needed immediately)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages
const HomeMenu = React.lazy(() => import("./pages/HomeMenu"));
const Profile = React.lazy(() => import("./pages/Profile"));
const MyDashboard = React.lazy(() => import("./pages/MyDashboard"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const DashboardAISummary = React.lazy(() => import("./pages/dashboard/DashboardAISummary"));
const DashboardAchievements = React.lazy(() => import("./pages/dashboard/DashboardAchievements"));
const DashboardHabits = React.lazy(() => import("./pages/dashboard/DashboardHabits"));
const DashboardPsychological = React.lazy(() => import("./pages/dashboard/DashboardPsychological"));
const DashboardLongevity = React.lazy(() => import("./pages/dashboard/DashboardLongevity"));
const DashboardBodyComposition = React.lazy(() => import("./pages/dashboard/DashboardBodyComposition"));
const DashboardMetabolic = React.lazy(() => import("./pages/dashboard/DashboardMetabolic"));
const Tests = React.lazy(() => import("./pages/Tests"));
const AppointmentsNew = React.lazy(() => import("./pages/AppointmentsNew"));
const FindProfessionals = React.lazy(() => import("./pages/FindProfessionals"));
const ProfessionalMode = React.lazy(() => import("./pages/ProfessionalMode"));
const ProfessionalDemoPage = React.lazy(() => import("./pages/ProfessionalDemoPage"));
const ProfessionalHistory = React.lazy(() => import("./pages/ProfessionalHistory"));
const ProfessionalClinicalHistory = React.lazy(() => import("./pages/ProfessionalClinicalHistory"));
const Reminders = React.lazy(() => import("./pages/Reminders"));
const Admin = React.lazy(() => import("./pages/Admin"));
const AdminSelectPatient = React.lazy(() => import("./pages/AdminSelectPatient"));
const NotificationSettings = React.lazy(() => import("./pages/NotificationSettings"));

const queryClient = new QueryClient();

// Detect if running as native app
const isNativeApp = Capacitor.isNativePlatform();

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminModeProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
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
            </Suspense>
          </BrowserRouter>
          </TooltipProvider>
        </AdminModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
