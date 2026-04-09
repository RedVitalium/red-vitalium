import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/custom-client';
import { useAuth } from './useAuth';

export type AppRole = 'patient' | 'admin' | 'professional';
export type SubscriptionPlan = 'plata' | 'oro' | 'platino' | 'black';
export type Specialty = 'psychology' | 'nutrition' | 'medicine' | 'physiotherapy';

export const specialtyLabels: Record<Specialty, string> = {
  psychology: 'Psicología',
  nutrition: 'Nutrición',
  medicine: 'Medicina',
  physiotherapy: 'Fisioterapia',
};

export const planLabels: Record<SubscriptionPlan, string> = {
  plata: 'Plan Plata',
  oro: 'Plan Oro',
  platino: 'Plan Platino',
  black: 'Plan Black',
};

export const planFeatures: Record<SubscriptionPlan, string[]> = {
  plata: ['Psicología', 'Hábitos básicos', 'Monitoreo de sueño y actividad'],
  oro: ['Todo de Plata', 'Nutrición', 'Marcadores metabólicos'],
  platino: ['Todo de Oro', 'Medicina', 'Biomarcadores completos'],
  black: ['Todo de Platino', 'Fisioterapia', 'Programa integral'],
};

interface UserRolesData {
  roles: AppRole[];
  subscription: SubscriptionPlan | null;
  isProfessional: boolean;
  professionalData: {
    specialty: Specialty;
    licenseNumber: string | null;
    bio: string | null;
    isVerified: boolean;
  } | null;
  isLoading: boolean;
}

export function useUserRoles(): UserRolesData {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [professionalData, setProfessionalData] = useState<UserRolesData['professionalData']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) {
        setRoles([]);
        setSubscription(null);
        setProfessionalData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch roles
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const userRoles = (rolesData?.map(r => r.role) || ['patient']) as AppRole[];
        setRoles(userRoles);

        // Fetch subscription
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('plan')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        setSubscription((subData?.plan as SubscriptionPlan) || 'plata');

        // Check if professional
        if (userRoles.includes('professional')) {
          const { data: profData } = await supabase
            .from('professionals')
            .select('specialty, license_number, bio, is_verified')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profData) {
            setProfessionalData({
              specialty: profData.specialty as Specialty,
              licenseNumber: profData.license_number,
              bio: profData.bio,
              isVerified: profData.is_verified,
            });
          }
        } else {
          setProfessionalData(null);
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [user]);

  return {
    roles,
    subscription,
    isProfessional: roles.includes('professional'),
    professionalData,
    isLoading,
  };
}

// Helper to check if feature is available based on subscription
export function isFeatureAvailable(
  subscription: SubscriptionPlan | null,
  requiredPlan: SubscriptionPlan
): boolean {
  if (!subscription) return false;
  
  const planOrder: SubscriptionPlan[] = ['plata', 'oro', 'platino', 'black'];
  const currentIndex = planOrder.indexOf(subscription);
  const requiredIndex = planOrder.indexOf(requiredPlan);
  
  return currentIndex >= requiredIndex;
}
