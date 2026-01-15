import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  TrendingUp, 
  Brain, 
  Heart, 
  Leaf,
  Sparkles,
  Play
} from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    target: 'welcome',
    title: '¡Bienvenido a Vitalium!',
    content: 'Este es tu dashboard personalizado donde podrás ver todos tus indicadores de salud y bienestar. Te guiaremos por cada sección.',
    icon: <Sparkles className="h-6 w-6" />,
    position: 'center'
  },
  {
    target: 'achievements',
    title: 'Logros Mensuales',
    content: 'Aquí verás tu progreso del ciclo de 4 semanas, medallas ganadas y el progreso hacia tu siguiente logro. ¡La gamificación te mantiene motivado!',
    icon: <Trophy className="h-6 w-6" />,
    position: 'bottom'
  },
  {
    target: 'weekly-progress',
    title: 'Progreso Semanal',
    content: 'Visualiza tu racha de días consecutivos cumpliendo objetivos, el porcentaje de metas semanales alcanzadas y tu mejora respecto al mes anterior.',
    icon: <TrendingUp className="h-6 w-6" />,
    position: 'bottom'
  },
  {
    target: 'cycle-indicator',
    title: 'Indicador de Ciclo',
    content: 'El programa Vitalium funciona en ciclos de 4 semanas: 3 semanas de hábitos guiados + 1 semana de prueba donde demuestras lo aprendido.',
    icon: <Heart className="h-6 w-6" />,
    position: 'left'
  },
  {
    target: 'tabs',
    title: 'Categorías de Métricas',
    content: 'Explora tus datos organizados en 4 categorías: Personal, Psicológico, Hábitos y Longevidad. Cada una con métricas específicas.',
    icon: <Brain className="h-6 w-6" />,
    position: 'top'
  },
  {
    target: 'metric-cards',
    title: 'Tarjetas de Métricas',
    content: 'Cada tarjeta muestra: valor actual, objetivo recomendado, cambio respecto al período anterior y un mini gráfico de tendencia.',
    icon: <Leaf className="h-6 w-6" />,
    position: 'top'
  },
  {
    target: 'final',
    title: '¡Listo para empezar!',
    content: 'Explora libremente el dashboard. Para acceder a tu propio panel con datos reales, crea una cuenta gratuita.',
    icon: <Sparkles className="h-6 w-6" />,
    position: 'center'
  }
];

interface DemoTourProps {
  onComplete: () => void;
}

export function DemoTour({ onComplete }: DemoTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showStartButton, setShowStartButton] = useState(true);

  useEffect(() => {
    // Check if tour was already completed
    const tourCompleted = localStorage.getItem('vitalium-demo-tour-completed');
    if (tourCompleted) {
      setShowStartButton(false);
    }
  }, []);

  const startTour = () => {
    setShowStartButton(false);
    setIsOpen(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsOpen(false);
    localStorage.setItem('vitalium-demo-tour-completed', 'true');
    onComplete();
  };

  const skipTour = () => {
    setIsOpen(false);
    setShowStartButton(false);
    localStorage.setItem('vitalium-demo-tour-completed', 'true');
    onComplete();
  };

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  if (showStartButton && !isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={startTour}
          className="gap-2 shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white px-6 py-6 text-base rounded-full"
        >
          <Play className="h-5 w-5" />
          Iniciar Tour Guiado
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={skipTour}
          />

          {/* Tour Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-full sm:max-w-md"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Paso {currentStep + 1} de {tourSteps.length}
                    </p>
                    <h3 className="font-display font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipTour}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-muted-foreground leading-relaxed">
                  {step.content}
                </p>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border flex items-center justify-between bg-muted/30">
                <Button
                  variant="ghost"
                  onClick={skipTour}
                  className="text-muted-foreground text-sm"
                >
                  Saltar tour
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    {currentStep === tourSteps.length - 1 ? (
                      'Finalizar'
                    ) : (
                      <>
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step indicators */}
              <div className="px-4 pb-4 flex justify-center gap-1.5">
                {tourSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'w-6 bg-primary'
                        : index < currentStep
                        ? 'w-1.5 bg-primary/50'
                        : 'w-1.5 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
