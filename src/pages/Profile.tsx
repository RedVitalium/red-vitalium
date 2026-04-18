import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit2, Save, X, User, FlaskConical, Watch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles, planLabels } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/custom-client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ProfileData {
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  sex: string | null;
  height: number | null;
  weight: number | null;
  waist_circumference: number | null;
  wearable_model: string | null;
  research_consent: boolean | null;
  research_consent_at: string | null;
  health_objectives: string[] | null;
  phone: string | null;
}

// Fields that patients CAN edit themselves
const editableFields = ['full_name', 'date_of_birth', 'sex', 'phone'];

// Fields that only professionals/admins can edit
const professionalOnlyFields = ['height', 'weight', 'waist_circumference'];

export default function Profile() {
  const { user } = useAuth();
  const { subscription } = useUserRoles();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, date_of_birth, sex, height, weight, waist_circumference, wearable_model, research_consent, research_consent_at, health_objectives, phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data as unknown as ProfileData);
        setEditedProfile(data as unknown as ProfileData);
      }
      setIsLoading(false);
    }

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !editedProfile) return;

    setIsSaving(true);
    
    // Only update editable fields
    const updateData = {
      full_name: editedProfile.full_name,
      phone: editedProfile.phone,
      date_of_birth: editedProfile.date_of_birth,
      sex: editedProfile.sex,
      health_objectives: editedProfile.health_objectives,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Error al guardar los cambios');
      console.error('Error updating profile:', error);
    } else {
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Mi Perfil" backTo="/home">
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-xl">
        {/* Avatar & Plan */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            {profile?.full_name || 'Sin nombre'}
          </h2>
          <p className="text-muted-foreground text-sm">{profile?.email}</p>
          {subscription && (
            <span className="inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
              {planLabels[subscription]}
            </span>
          )}
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-display font-semibold mb-6 text-foreground">
              Datos Personales
            </h3>
            
            <div className="space-y-5">
              {/* Editable fields */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                {isEditing ? (
                  <Input
                    id="full_name"
                    value={editedProfile?.full_name || ''}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                  />
                ) : (
                  <p className="text-foreground py-2">{profile?.full_name || 'Sin datos'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                {isEditing ? (
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={editedProfile?.date_of_birth || ''}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, date_of_birth: e.target.value} : null)}
                  />
                ) : (
                  <p className="text-foreground py-2">{profile?.date_of_birth || 'Sin datos'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                {isEditing ? (
                  <Select
                    value={editedProfile?.sex || ''}
                    onValueChange={(value) => setEditedProfile(prev => prev ? {...prev, sex: value} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground py-2">
                    {profile?.sex === 'male' ? 'Masculino' : profile?.sex === 'female' ? 'Femenino' : 'Sin datos'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+52 55 1234 5678"
                      value={editedProfile?.phone || ''}
                      onChange={(e) => setEditedProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                    />
                    {editedProfile?.phone && !/^\+[0-9]{7,15}$/.test(editedProfile.phone.replace(/\s/g, '')) && (
                      <p className="text-xs text-destructive">Debe comenzar con + y código de país (ej: +52 55 1234 5678)</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground py-2">{profile?.phone || 'Sin datos'}</p>
                )}
              </div>

              {/* Health Objectives */}
              <div className="space-y-2">
                <Label>Mis Objetivos de Salud <span className="text-xs text-muted-foreground">(máximo 3)</span></Label>
                {(() => {
                  const age = profile?.date_of_birth ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 35;
                 const options = age < 36 ? [
                    "Mejorar mi salud general",
                    "Ganar masa muscular",
                    "Bajar de peso",
                    "Nivel atleta",
                    "Manejar estrés y sueño",
                    "Longevidad y prevención",
                  ] : age < 56 ? [
                    "Mejorar mi salud general",
                    "Longevidad y prevención",
                    "Bajar de peso",
                    "Ganar movilidad y fuerza",
                    "Manejar estrés y sueño",
                    "Nivel atleta",
                  ] : [
                    "Mantenerme activo y saludable",
                    "Longevidad y prevención",
                    "Ganar movilidad",
                    "Manejar dolor crónico",
                    "Mejorar sueño",
                    "Nivel atleta",
                  ];
                  const selected: string[] = (isEditing ? editedProfile?.health_objectives : profile?.health_objectives) || [];
                  const toggleObjective = (obj: string) => {
                    if (!isEditing) return;
                    setEditedProfile(prev => {
                      if (!prev) return null;
                      const current = prev.health_objectives || [];
                      if (current.includes(obj)) {
                        return { ...prev, health_objectives: current.filter(o => o !== obj) };
                      } else if (current.length < 3) {
                        return { ...prev, health_objectives: [...current, obj] };
                      }
                      return prev;
                    });
                  };
                  return (
                    <div className="space-y-2">
                      {options.map(opt => (
                        <div
                          key={opt}
                          onClick={() => toggleObjective(opt)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            isEditing ? 'cursor-pointer hover:bg-muted/50' : ''
                          } ${selected.includes(opt) ? 'border-primary bg-primary/5' : 'border-border'}`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selected.includes(opt) ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {selected.includes(opt) && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-sm ${selected.includes(opt) ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {opt}
                          </span>
                        </div>
                      ))}
                      {selected.length === 3 && isEditing && (
                        <p className="text-xs text-amber-600">Máximo 3 objetivos seleccionados</p>
                      )}
                    </div>
                  );
                })()}
              </div>
 
              {/* Divider */}
              <div className="h-px bg-border my-6" />

              <p className="text-xs text-muted-foreground mb-4">
                Los siguientes datos son ingresados por tu equipo de profesionales:
              </p>

              {/* Read-only fields for patients */}
              <div className="space-y-2">
                <Label>Altura</Label>
                <p className="text-foreground py-2 bg-muted/30 px-3 rounded-md">
                  {profile?.height ? `${profile.height} cm` : 'Sin datos'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Peso</Label>
                <p className="text-foreground py-2 bg-muted/30 px-3 rounded-md">
                  {profile?.weight ? `${profile.weight} kg` : 'Sin datos'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Circunferencia de Cintura</Label>
                <p className="text-foreground py-2 bg-muted/30 px-3 rounded-md">
                  {profile?.waist_circumference ? `${profile.waist_circumference} cm` : 'Sin datos'}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Watch className="h-4 w-4 text-muted-foreground" />
                  Dispositivo
                </Label>
                <p className="text-foreground py-2 bg-muted/30 px-3 rounded-md">
                  {profile?.wearable_model || 'Sin dispositivo registrado'}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-border my-6" />

              {/* Research Consent Section */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  Consentimiento de Investigación
                </Label>
                {profile?.research_consent ? (
                  <div className="flex items-center gap-3 py-2 bg-muted/30 px-3 rounded-md">
                    <Badge className="bg-green-500/15 text-green-700 border-green-500/30 hover:bg-green-500/20">
                      Investigación autorizada
                    </Badge>
                    {profile.research_consent_at && (
                      <span className="text-xs text-muted-foreground">
                        Desde {format(new Date(profile.research_consent_at), "d MMM yyyy", { locale: es })}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="py-2 bg-muted/30 px-3 rounded-md">
                    <Badge variant="secondary">No autorizado para investigación</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Puedes autorizar el uso de tus datos anonimizados para investigación científica contactando a tu equipo Vitalium
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Preferences - Hidden until dark mode is properly implemented */}
        {/*
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="p-6">
            <h3 className="text-lg font-display font-semibold mb-6 text-foreground">
              Preferencias
            </h3>
            <ThemeToggle />
          </Card>
        </motion.div>
        */}
      </main>
    </div>
  );
}
