import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import appLogo from "@/assets/app-logo.png";
import { 
  Activity, 
  Brain, 
  Heart, 
  Smartphone, 
  Calendar, 
  BarChart3,
  ArrowRight,
  Check,
  LogIn
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Monitoreo de Biomarcadores",
    description: "Conecta tus dispositivos wearables y visualiza sueño, VFC, actividad física y más",
  },
  {
    icon: Brain,
    title: "Evaluación Psicológica",
    description: "Tests validados (DASS-21, BFI-10, SWLS) para monitorear tu bienestar mental",
  },
  {
    icon: Heart,
    title: "Hábitos Saludables",
    description: "Recordatorios inteligentes para comidas, sueño y rutinas diarias",
  },
  {
    icon: BarChart3,
    title: "Dashboard Visual",
    description: "Gráficos con sistema de semáforo para entender tu progreso de un vistazo",
  },
  {
    icon: Calendar,
    title: "Gestión de Citas",
    description: "Agenda consultas con especialistas en psicología y bienestar",
  },
  {
    icon: Smartphone,
    title: "Integración Digital",
    description: "Conecta con Health Connect y monitorea tu bienestar digital",
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
  return (
    <div className="min-h-screen">
      {/* Header with white background for contrast */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={appLogo}
              alt="Vitalium"
              className="h-10 w-auto"
            />
            <span className="text-xl font-display font-bold text-secondary">VITALIUM</span>
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
              src={appLogo}
              alt="Vitalium"
              className="h-32 w-auto mx-auto mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold mb-6 leading-tight">
              Salud, Rendimiento <br className="hidden md:block"/>
              y <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Longevidad</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              El <span className="font-semibold text-white">modelo híbrido</span> definitivo en medicina preventiva. 
              Fusionamos ciencia avanzada, tecnología de datos y bienestar integral para potenciar tu vida.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <Link to="/dashboard?demo=true">
                  Ver Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
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

      {/* Features Section */}
      <section className="py-20 bg-background">
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
              Combinamos lo mejor de la medicina presencial con el poder del monitoreo digital continuo
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

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                El Modelo <span className="gradient-text">Vitalium</span>
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Un enfoque integral que combina psicología, nutrición, actividad física y monitoreo 
                de biomarcadores para optimizar tu salud y longevidad.
              </p>
              <ul className="space-y-4">
                {[
                  "Evaluaciones psicológicas validadas científicamente",
                  "Monitoreo continuo de biomarcadores de salud",
                  "Sistema de gamificación para mantener la motivación",
                  "Recordatorios personalizados para hábitos saludables",
                  "Dashboard visual con sistema de semáforo",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8">
                <Link to="/dashboard">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="p-8 bg-gradient-to-br from-primary via-primary to-accent/50 text-primary-foreground">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-display font-bold mb-4">
                    ¿Por qué Vitalium?
                  </h3>
                  <ul className="space-y-4 text-primary-foreground/90">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                      <span>Enfoque preventivo basado en evidencia científica</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                      <span>Atención personalizada con profesionales de salud</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                      <span>Tecnología de monitoreo continuo con wearables</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                      <span>Sistema de gamificación que te mantiene motivado</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </motion.div>
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
              Agenda tu primera consulta en nuestra clínica en Villahermosa, Tabasco, 
              y toma el control de tu salud futura hoy mismo.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-6">
              <a 
                href="mailto:info@vitalium.mx" 
                className="flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 py-4 px-8 rounded-xl transition border border-gray-700"
              >
                <span>info@vitalium.mx</span>
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
    </div>
  );
}
