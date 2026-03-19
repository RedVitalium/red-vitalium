import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import appLogo from "@/assets/app-logo.png";
import vitaliumNegativo from "@/assets/vitalium-negativo.png";
import { DemoSelectionDialog } from "@/components/DemoSelectionDialog";
import { 
  Activity, 
  Brain, 
  Heart, 
  Smartphone, 
  Calendar, 
  BarChart3,
  ArrowRight,
  Check,
  LogIn,
  Users,
  Shield,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Bienestar Psicológico",
    description: "Identifica los patrones mentales que frenan tus hábitos — antes de que se conviertan en un problema de salud.",
  },
  {
    icon: Activity,
    title: "Optimización Metabólica",
    description: "Nutrición personalizada con base en tus datos reales, no en dietas genéricas.",
  },
  {
    icon: Heart,
    title: "Salud Sistémica",
    description: "Control médico preventivo para intervenir antes de que aparezcan los síntomas.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de Datos",
    description: "Todo lo que mide tu cuerpo en un solo lugar — visible para ti y tu equipo de salud.",
  },
  {
    icon: Users,
    title: "Red de Profesionales",
    description: "Acceso a especialistas certificados en la metodología Vitalium",
  },
  {
    icon: Smartphone,
    title: "Integración Digital",
    description: "Conecta tus dispositivos y visualiza tu progreso en tiempo real",
  },
];

const plans = [
  {
    name: "Plan Plata",
    subtitle: "Fundamentos Conductuales",
    features: ["Psicología", "Formación de hábitos", "Monitoreo de sueño y actividad"],
    color: "from-gray-400 to-gray-500",
  },
  {
    name: "Plan Oro",
    subtitle: "Optimización Metabólica",
    features: ["Todo de Plata", "Nutrición personalizada", "Marcadores metabólicos"],
    color: "from-yellow-400 to-amber-500",
  },
  {
    name: "Plan Platino",
    subtitle: "Salud Sistémica",
    features: ["Todo de Oro", "Medicina preventiva", "Biomarcadores completos"],
    color: "from-slate-300 to-slate-400",
  },
  {
    name: "Plan Black",
    subtitle: "Integridad Estructural",
    features: ["Todo de Platino", "Fisioterapia", "Programa integral"],
    color: "from-gray-800 to-gray-900",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Index() {
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <DemoSelectionDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen} />
      {/* Header with white background for contrast */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={appLogo}
              alt="Red Vitalium"
              className="h-10 w-auto"
            />
            <span className="text-xl font-display font-bold text-secondary">RED VITALIUM</span>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/auth">
              <LogIn className="h-4 w-4" />
              Ingresar
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-secondary via-secondary/95 to-primary/90 text-secondary-foreground overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.img
              src={vitaliumNegativo}
              alt="Red Vitalium"
              className="h-32 w-auto mx-auto mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold mb-6 leading-tight">
              Longevidad y Bienestar <br className="hidden md:block"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Basado en Datos</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              El sistema que conecta tus datos reales con un equipo de especialistas para que vivas más tiempo y con más energía.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={() => setDemoDialogOpen(true)}
              >
                Ver Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-primary font-bold text-lg px-8 py-6 rounded-full transition-all hover:-translate-y-1 bg-transparent"
              >
                <Link to="/appointments">
                  Agendar Consulta
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              ¿Por qué Red Vitalium?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Profesionales "vetados" de alta calidad + programa basado en datos reales + flexibilidad geográfica = progreso medible hacia la longevidad
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Para el Paciente</h3>
              <p className="text-sm text-muted-foreground">
                Acceso a profesionales de alta calidad con un programa basado en datos reales, no supuestos
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Para el Profesional</h3>
              <p className="text-sm text-muted-foreground">
                Flujo constante de pacientes y acceso a herramientas de monitoreo de última generación
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Metodología Vitalium</h3>
              <p className="text-sm text-muted-foreground">
                Enfoque en hábitos sostenibles, no solo síntomas. Supervisión y auditoría del progreso
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Tu Salud, Integrada
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Combinamos lo mejor de la atención presencial con el poder del monitoreo digital continuo
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-8 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group border-2 border-transparent hover:border-primary/20">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Escalera de Valor
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comienza con los fundamentos y escala según tu progreso y objetivos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.color}`} />
                  <h3 className="font-display font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.subtitle}</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Empieza tu Transformación
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-lg">
              Visita nuestras oficinas de captación en Villahermosa, Tabasco, 
              para conocer el programa y comenzar tu viaje hacia la longevidad.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Button 
                asChild 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 font-bold rounded-full"
              >
                <Link to="/appointments">
                  <Calendar className="h-5 w-5 mr-2" />
                  Agendar Cita
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-primary rounded-full bg-transparent"
              >
                <Link to="/find-professionals">
                  <Users className="h-5 w-5 mr-2" />
                  Ver Profesionales
                </Link>
              </Button>
            </div>
            <div className="flex flex-col md:flex-row justify-center gap-6">
              <a 
                href="mailto:info@redvitalium.mx" 
                className="flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 py-4 px-8 rounded-xl transition border border-gray-700"
              >
                <span>info@redvitalium.mx</span>
              </a>
              <a 
                href="tel:+529931234567" 
                className="flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 py-4 px-8 rounded-xl transition border border-gray-700"
              >
                <span>+52 (993) 123 4567</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/95 text-secondary-foreground py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-70">© 2025 Red Vitalium. Todos los derechos reservados.</p>
          <p className="text-xs mt-2 opacity-50">Longevidad y Bienestar Basado en Datos</p>
        </div>
      </footer>
    </div>
  );
}
