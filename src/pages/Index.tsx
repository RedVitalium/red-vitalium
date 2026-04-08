import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import appLogo from "@/assets/app-logo.png";
import vitaliumNegativo from "@/assets/vitalium-negativo.png";
import { DemoSelectionDialog } from "@/components/DemoSelectionDialog";
import { VideoPreview } from "@/components/VideoPreview";
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
    description: "Psicólogos, nutriólogos y médicos que ven tus datos antes de cada consulta.",
  },
  {
    icon: Smartphone,
    title: "Integración Digital",
    description: "Compatible con cualquier reloj o anillo inteligente. Cambia de dispositivo sin perder tu historial.",
  },
];

const plans = [
  {
    name: "Plan Plata",
    price: "$1,200",
    duration: "6 meses · Psicología incluida",
    subtitle: "Sueño, hábitos y bienestar mental — la base de todo lo demás.",
    features: ["Psicología", "Formación de hábitos", "Monitoreo de sueño y actividad"],
    color: "from-gray-400 to-gray-500",
  },
  {
    name: "Plan Oro",
    price: "$2,250",
    duration: "6 meses · Psicología + Nutrición",
    subtitle: "Suma nutrición personalizada a partir del mes 3.",
    features: ["Todo de Plata", "Nutrición personalizada", "Marcadores metabólicos"],
    color: "from-yellow-400 to-amber-500",
  },
  {
    name: "Plan Platino",
    price: "$3,300",
    duration: "6 meses · Psicología + Nutrición + Medicina",
    subtitle: "Añade control médico preventivo y biomarcadores completos.",
    features: ["Todo de Oro", "Medicina preventiva", "Biomarcadores completos"],
    color: "from-slate-300 to-slate-400",
  },
  {
    name: "Plan Black",
    price: "$4,100",
    duration: "6 meses · Programa integral completo",
    subtitle: "Equipo completo. Máximo rendimiento y longevidad.",
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

  useEffect(() => {
    if (window.location.hash === '#planes') {
      document.getElementById('planes')?.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

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
                Conoce Nuestra App
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
              Especialistas seleccionados por Vitalium · seguimiento con datos reales · atención presencial o remota = progreso medible en longevidad y bienestar
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
      <section id="planes" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Elige tu nivel de acompañamiento
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Empieza con lo esencial y suma especialistas conforme avanzas.
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
                  <div className="mb-1">
                    <span className="text-2xl font-display font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">MXN/mes</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{plan.duration}</p>
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

      {/* Video Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Mira cómo funciona
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <VideoPreview
              youtubeUrl="https://youtube.com/shorts/VOaWV0wPhYc?si=TkNYBhZoOsKrZmr-"
              title="Conoce cómo funciona Red Vitalium"
            />
          </motion.div>
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
              Tu primera sesión incluye medición de composición corporal, evaluación psicológica y setup de tu dispositivo. Sin compromiso.
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
                href="mailto:vitalium.mx@gmail.com" 
                className="flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 py-4 px-8 rounded-xl transition border border-gray-700"
              >
                <span>vitalium.mx@gmail.com</span>
              </a>
              <a 
                href="tel:+529937005054" 
                className="flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 py-4 px-8 rounded-xl transition border border-gray-700"
              >
                <span>+52 993 700 5054</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/95 text-secondary-foreground py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-4">
            {[
              { href: "https://www.instagram.com/redvitalium/", label: "Instagram", d: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" },
              { href: "https://facebook.com/redvitalium", label: "Facebook", d: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" },
              { href: "https://linkedin.com/company/redvitalium", label: "LinkedIn", d: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d={social.d} />
                </svg>
              </a>
            ))}
          </div>
          <p className="text-sm opacity-70">© 2026 Red Vitalium. Todos los derechos reservados.</p>
          <p className="text-xs mt-2 opacity-50">Longevidad y Bienestar Basado en Datos</p>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/529937005054"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group"
      >
        <div className="relative w-14 h-14 md:w-12 md:h-12 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
          <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-6 md:h-6 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ¿Dudas? Escríbenos
        </span>
      </a>
    </div>
  );
}
