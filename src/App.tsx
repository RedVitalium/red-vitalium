import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from "@capacitor/core";
import { AuthProvider } from "./hooks/useAuth";
import { supabase } from "@/integrations/supabase/custom-client";
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
const UploadScreenshot = React.lazy(() => import("./pages/UploadScreenshot"));
const Reminders = React.lazy(() => import("./pages/Reminders"));
const Admin = React.lazy(() => import("./pages/Admin"));
const AdminSelectPatient = React.lazy(() => import("./pages/AdminSelectPatient"));
const NotificationSettings = React.lazy(() => import("./pages/NotificationSettings"));

const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const Privacy = React.lazy(() => import("./pages/Privacy"));

const queryClient = new QueryClient();

// Detect if running as native app
const isNativeApp = Capacitor.isNativePlatform();

// Rehydrate native session from Preferences before rendering
function NativeSessionLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(!isNativeApp);

  React.useEffect(() => {
    if (!isNativeApp) return;
    (async () => {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key: 'supabase_session' });
        if (value) {
          const parsed = JSON.parse(value);
          const { error } = await supabase.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          });
          if (error) {
            console.warn('Session restore failed, clearing:', error.message);
            await Preferences.remove({ key: 'supabase_session' });
          }
        }
      } catch (e) {
        console.warn('Error restoring native session:', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return <LoadingSpinner />;
  return <>{children}</>;
}

const AuthCallback = () => {
  React.useEffect(() => {
    const handleCallback = async () => {
      await supabase.auth.exchangeCodeForSession(window.location.href);
      window.location.replace('/home');
    };
    handleCallback();
  }, []);
  return <LoadingSpinner />;
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Back button handler for Android
function BackButtonHandler() {
  React.useEffect(() => {
    if (!isNativeApp) return;

    const handler = CapApp.addListener('backButton', () => {
      const currentPath = window.location.pathname;
      
      // On home, auth, or root: minimize app
      if (currentPath === '/home' || currentPath === '/auth' || currentPath === '/') {
        CapApp.minimizeApp();
        return;
      }
      
      // Dashboard sub-pages → go to my-dashboard
      if (currentPath.startsWith('/dashboard/')) {
        window.location.pathname = '/my-dashboard';
        return;
      }
      
      // Professional sub-pages → go to professional
      if (currentPath === '/professional/history' || currentPath === '/professional/clinical-history') {
        window.location.pathname = '/professional';
        return;
      }
      
      // Everything else → go to home
      window.location.pathname = '/home';
    });

    return () => {
      handler.then(h => h.remove());
    };
  }, []);

return null;
}

// Deep link handler for Google OAuth callback
function AppUrlOpenHandler() {
  React.useEffect(() => {
    if (!isNativeApp) return;

    const handler = CapApp.addListener('appUrlOpen', async (event) => {
      const url = event.url;
      if (url.includes('redvitalium.com/auth/callback') ||
          url.includes('huxadvolwgfdjgsnraxm.supabase.co/auth/v1/callback') || 
          url.includes('#access_token') || 
          url.includes('?code=')) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.close();
        const { error } = await supabase.auth.exchangeCodeForSession(url);
        if (error) {
          console.warn('OAuth callback error:', error.message);
        }
      }
    });

    return () => {
      handler.then(h => h.remove());
    };
  }, []);

  return null;
}

const App = () => (  <QueryClientProvider client={queryClient}>
    <NativeSessionLoader>
    <AuthProvider>
      <AdminModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <BackButtonHandler />
            <AppUrlOpenHandler />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Landing page - only for web, native goes to auth */}
                <Route path="/" element={isNativeApp ? <Navigate to="/auth" replace /> : <Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<Privacy />} />
                
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
                <Route path="/professional/upload-screenshot" element={
                  <ProtectedRoute><UploadScreenshot /></ProtectedRoute>
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
    </NativeSessionLoader>
  </QueryClientProvider>
);

export default App;
