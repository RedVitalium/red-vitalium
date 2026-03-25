import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { specialtyLabels, Specialty } from "@/hooks/useUserRoles";
import { PageHeader } from "@/components/PageHeader";

interface Professional {
  id: string;
  user_id: string;
  specialty: Specialty;
  license_number: string | null;
  bio: string | null;
  years_experience: number | null;
  consultation_price: number | null;
  is_verified: boolean;
  location: string | null;
  office_address: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export default function FindProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // In a real implementation, this would fetch from the database
  useEffect(() => {
    async function fetchProfessionals() {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('professionals')
          .select(`
            id,
            user_id,
            specialty,
            license_number,
            bio,
            years_experience,
            consultation_price,
            is_verified,
            location,
            office_address
          `)
          .eq('is_active', true);

        if (error) throw error;

        const professionalsWithProfiles = await Promise.all(
          (data || []).map(async (prof) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email, avatar_url')
              .eq('user_id', prof.user_id)
              .maybeSingle();

            return {
              ...prof,
              specialty: prof.specialty as Specialty,
              profile: profileData || undefined,
            };
          })
        );
        setProfessionals(professionalsWithProfiles);
      } catch (error) {
        console.error('Error fetching professionals:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfessionals();
  }, []);

  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = searchTerm === '' || 
      prof.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.bio?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty = selectedSpecialty === 'all' || prof.specialty === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Profesionales" backTo="/home" />

      {/* Search & Filters */}
      <div className="sticky top-[72px] z-40 bg-background border-b border-border/50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="psychology">Psicología</SelectItem>
                <SelectItem value="nutrition">Nutrición</SelectItem>
                <SelectItem value="medicine">Medicina</SelectItem>
                <SelectItem value="physiotherapy">Fisioterapia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron profesionales</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="space-y-4"
          >
            {filteredProfessionals.map((prof) => (
              <motion.div
                key={prof.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-primary">
                        {prof.profile?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {prof.profile?.full_name || 'Profesional'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {specialtyLabels[prof.specialty]}
                            </Badge>
                            {prof.is_verified && (
                              <Badge variant="outline" className="text-success border-success">
                                Verificado
                              </Badge>
                            )}
                          </div>
                        </div>
                        {prof.consultation_price && (
                          <span className="text-sm font-semibold text-primary">
                            ${prof.consultation_price} MXN
                          </span>
                        )}
                      </div>

                      {prof.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {prof.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {prof.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {prof.location}
                          </span>
                        )}
                        {prof.years_experience && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {prof.years_experience} años exp.
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" asChild>
                          <Link to={`/appointments?professional=${prof.id}`}>
                            <Calendar className="h-4 w-4 mr-1" />
                            Agendar
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline">
                          Ver Perfil
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
