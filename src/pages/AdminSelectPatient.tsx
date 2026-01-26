import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminMode } from '@/hooks/useAdminMode';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, User, ArrowLeft, Calendar, UserCircle } from 'lucide-react';

interface Patient {
  user_id: string;
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  sex: string | null;
  avatar_url: string | null;
}

export default function AdminSelectPatient() {
  const navigate = useNavigate();
  const { setSelectedPatient, setCurrentMode } = useAdminMode();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all patients
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['admin-all-patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, date_of_birth, sex, avatar_url')
        .order('full_name');
      
      if (error) throw error;
      return data as Patient[];
    },
  });

  // Filter patients based on search
  const filteredPatients = patients.filter(patient => {
    const search = searchTerm.toLowerCase();
    return (
      patient.full_name?.toLowerCase().includes(search) ||
      patient.email?.toLowerCase().includes(search)
    );
  });

  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient({
      userId: patient.user_id,
      fullName: patient.full_name || 'Sin nombre',
      email: patient.email || undefined,
    });
    navigate('/dashboard');
  };

  const handleBack = () => {
    setCurrentMode(null);
    navigate('/dashboard');
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Seleccionar Paciente
          </h1>
          <p className="text-muted-foreground">
            Elige el paciente cuyo dashboard deseas visualizar
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Patient List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Cargando pacientes...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border">
                  {filteredPatients.map((patient, index) => {
                    const age = calculateAge(patient.date_of_birth);
                    const isCurrentUser = patient.user_id === user?.id;
                    
                    return (
                      <motion.button
                        key={patient.user_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(patient.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {patient.full_name || 'Sin nombre'}
                            </p>
                            {isCurrentUser && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Tú
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {patient.email}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {age !== null && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {age} años
                            </span>
                          )}
                          {patient.sex && (
                            <span className="flex items-center gap-1">
                              <UserCircle className="h-3 w-3" />
                              {patient.sex === 'male' ? 'M' : patient.sex === 'female' ? 'F' : '-'}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Al seleccionar un paciente, verás su dashboard con permisos de administrador
        </motion.p>
      </div>
    </div>
  );
}
