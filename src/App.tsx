import React, { Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { ThemeProvider } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./hooks/useAuth";
import { AdminModeProvider } from "./hooks/useAdminMode";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PageTransition } from "./components/PageTransition";
import { restoreNativeSession, startNativeStorageSync } from "./lib/supabase-storage-adapter";

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
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

// Detect if running as native app
const isNativeApp = Capacitor.isNativePlatform();

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function UpgradeRedirect() {
  React.useEffect(() => {
    window.location.replace('/#planes');
  }, []);
  return null;
}

const P = ({ children }: { children: React.ReactNode }) => <PageTransition>{children}</PageTransition>;

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing page - only for web, native goes to auth */}
        <Route path="/" element={isNativeApp ? <Navigate to="/auth" replace /> : <P><Index /></P>} />
        <Route path="/auth" element={<P><Auth /></P>} />
        <Route path="/reset-password" element={<P><ResetPassword /></P>} />
        
        {/* New home menu - protected, first page after login */}
        <Route path="/home" element={
          <ProtectedRoute><P><HomeMenu /></P></ProtectedRoute>
        } />
        
        {/* Profile page */}
        <Route path="/profile" element={
          <ProtectedRoute><P><Profile /></P></ProtectedRoute>
        } />
        
        {/* My Dashboard menu */}
        <Route path="/my-dashboard" element={
          <ProtectedRoute><P><MyDashboard /></P></ProtectedRoute>
        } />
        
        {/* Dashboard sub-pages */}
        <Route path="/dashboard/ai-summary" element={
          <ProtectedRoute><P><DashboardAISummary /></P></ProtectedRoute>
        } />
        <Route path="/dashboard/achievements" element={
          <ProtectedRoute><P><DashboardAchievements /></P></ProtectedRoute>
        } />
        <Route path="/dashboard/habits" element={
          <ProtectedRoute><P><DashboardHabits /></P></ProtectedRoute>
        } />
        <Route path="/dashboard/psychological" element={
          <ProtectedRoute><P><DashboardPsychological /></P></ProtectedRoute>
        } />
        <Route path="/dashboard/longevity" element={
          <ProtectedRoute><P><DashboardLongevity /></P></ProtectedRoute>
        } />
        <Route path="/dashboard/body-composition" element={
          <ProtectedRoute><P><DashboardBodyComposition /></P></ProtectedRoute>
        } />
        <Route path="/dashboard/metabolic" element={
          <ProtectedRoute><P><DashboardMetabolic /></P></ProtectedRoute>
        } />
        
        {/* Legacy dashboard route */}
        <Route path="/dashboard" element={
          <ProtectedRoute><P><Dashboard /></P></ProtectedRoute>
        } />
        
        {/* Appointments with dropdowns */}
        <Route path="/appointments" element={<P><AppointmentsNew /></P>} />
        
        {/* Find professionals */}
        <Route path="/find-professionals" element={
          <ProtectedRoute><P><FindProfessionals /></P></ProtectedRoute>
        } />
        
        {/* Professional mode */}
        <Route path="/professional" element={
          <ProtectedRoute><P><ProfessionalMode /></P></ProtectedRoute>
        } />
        {/* Professional demo (no auth required) */}
        <Route path="/demo/professional" element={<P><ProfessionalDemoPage /></P>} />
        <Route path="/professional/history" element={
          <ProtectedRoute><P><ProfessionalHistory /></P></ProtectedRoute>
        } />
        <Route path="/professional/clinical-history" element={
          <ProtectedRoute><P><ProfessionalClinicalHistory /></P></ProtectedRoute>
        } />
        
        {/* Tests */}
        <Route path="/tests" element={
          <ProtectedRoute><P><Tests /></P></ProtectedRoute>
        } />
        
        {/* Reminders */}
        <Route path="/reminders" element={
          <ProtectedRoute><P><Reminders /></P></ProtectedRoute>
        } />
        
        {/* Notification settings */}
        <Route path="/notification-settings" element={
          <ProtectedRoute><P><NotificationSettings /></P></ProtectedRoute>
        } />
        <Route path="/settings/notifications" element={
          <ProtectedRoute><P><NotificationSettings /></P></ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin><P><Admin /></P></ProtectedRoute>
        } />
        <Route path="/admin/select-patient" element={
          <ProtectedRoute requireAdmin><P><AdminSelectPatient /></P></ProtectedRoute>
        } />
        
        {/* Upgrade redirect to plans section */}
        <Route path="/upgrade" element={<UpgradeRedirect />} />
        
        {/* 404 */}
        <Route path="*" element={<P><NotFound /></P>} />
      </Routes>
    </AnimatePresence>
  );
}

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
              <AnimatedRoutes />
            </Suspense>
          </BrowserRouter>
          </TooltipProvider>
        </AdminModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
