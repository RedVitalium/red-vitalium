import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './useAuth';

interface SelectedPatient {
  userId: string;
  fullName: string;
  email?: string;
}

interface AdminModeContextType {
  // Current mode: null = not decided, 'patient' = viewing own dashboard, 'admin' = viewing patient as admin
  currentMode: 'patient' | 'admin' | null;
  setCurrentMode: (mode: 'patient' | 'admin' | null) => void;
  
  // Selected patient when in admin mode
  selectedPatient: SelectedPatient | null;
  setSelectedPatient: (patient: SelectedPatient | null) => void;
  
  // Helper to check if we're viewing as admin
  isViewingAsAdmin: boolean;
  
  // The user ID to use for data fetching (either current user or selected patient)
  targetUserId: string | null;
  
  // Reset mode (e.g., on logout)
  resetMode: () => void;
  
  // Whether to show the role selection dialog
  shouldShowRoleSelection: boolean;
  setShouldShowRoleSelection: (show: boolean) => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [currentMode, setCurrentMode] = useState<'patient' | 'admin' | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [shouldShowRoleSelection, setShouldShowRoleSelection] = useState(false);

  // When user logs in and is admin, we need to show role selection
  useEffect(() => {
    if (user && isAdmin && currentMode === null) {
      setShouldShowRoleSelection(true);
    }
  }, [user, isAdmin, currentMode]);

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      setCurrentMode(null);
      setSelectedPatient(null);
      setShouldShowRoleSelection(false);
    }
  }, [user]);

  const resetMode = () => {
    setCurrentMode(null);
    setSelectedPatient(null);
    setShouldShowRoleSelection(false);
  };

  const isViewingAsAdmin = currentMode === 'admin' && selectedPatient !== null;
  
  // The target user ID for data fetching
  const targetUserId = isViewingAsAdmin ? selectedPatient?.userId : user?.id || null;

  return (
    <AdminModeContext.Provider value={{
      currentMode,
      setCurrentMode,
      selectedPatient,
      setSelectedPatient,
      isViewingAsAdmin,
      targetUserId,
      resetMode,
      shouldShowRoleSelection,
      setShouldShowRoleSelection,
    }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (context === undefined) {
    throw new Error('useAdminMode must be used within an AdminModeProvider');
  }
  return context;
}
