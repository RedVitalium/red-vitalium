import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type ActiveRole = 'patient' | 'admin' | 'professional';

interface SelectedPatient {
  userId: string;
  fullName: string;
  email?: string;
}

interface AdminModeContextType {
  currentMode: ActiveRole | null;
  setCurrentMode: (mode: ActiveRole | null) => void;
  
  selectedPatient: SelectedPatient | null;
  setSelectedPatient: (patient: SelectedPatient | null) => void;
  
  isViewingAsAdmin: boolean;
  targetUserId: string | null;
  
  resetMode: () => void;
  
  shouldShowRoleSelection: boolean;
  setShouldShowRoleSelection: (show: boolean) => void;
  
  // All roles the current user has
  userRoles: ActiveRole[];
  hasMultipleRoles: boolean;
  rolesLoaded: boolean;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [currentMode, setCurrentMode] = useState<ActiveRole | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [shouldShowRoleSelection, setShouldShowRoleSelection] = useState(false);
  const [userRoles, setUserRoles] = useState<ActiveRole[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  // Fetch all roles for current user
  useEffect(() => {
    if (!user) {
      setUserRoles([]);
      setRolesLoaded(false);
      return;
    }

    const fetchRoles = async () => {
      const roles: ActiveRole[] = ['patient']; // Everyone is a patient

      // Check admin
      const { data: adminData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (adminData) roles.push('admin');

      // Check professional
      const { data: profData } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (profData) roles.push('professional');

      setUserRoles(roles);
      setRolesLoaded(true);
    };

    fetchRoles();
  }, [user]);

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      setCurrentMode(null);
      setSelectedPatient(null);
      setShouldShowRoleSelection(false);
      setUserRoles([]);
    }
  }, [user]);

  const resetMode = () => {
    setCurrentMode(null);
    setSelectedPatient(null);
    setShouldShowRoleSelection(false);
  };

  const isViewingAsAdmin = (currentMode === 'admin' || currentMode === 'professional') && selectedPatient !== null;
  const targetUserId = isViewingAsAdmin ? selectedPatient?.userId : user?.id || null;
  const hasMultipleRoles = userRoles.length > 1;

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
      userRoles,
      hasMultipleRoles,
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
