import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-display font-bold">Política de Privacidad</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl prose prose-sm dark:prose-invert">
        <h1 className="text-2xl font-display font-bold mb-2">Política de Privacidad de Red Vitalium</h1>
        <p className="text-muted-foreground text-sm mb-6">Última actualización: Abril 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Datos que recopilamos</h2>
          <p>Red Vitalium recopila los siguientes tipos de información para brindarte un servicio de salud integral:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Datos de salud:</strong> composición corporal, biomarcadores sanguíneos, métricas de longevidad (fuerza de agarre, equilibrio, VO2 Máx), edad biológica y metabólica.</li>
            <li><strong>Datos de dispositivos:</strong> frecuencia cardíaca, variabilidad cardíaca (HRV), pasos, calorías, SpO2 nocturno, sueño y estrés, sincronizados desde tu dispositivo.</li>
            <li><strong>Encuestas y hábitos:</strong> respuestas a encuestas diarias de hábitos de salud, metas y progreso semanal.</li>
            <li><strong>Datos de perfil:</strong> nombre, correo electrónico, fecha de nacimiento, sexo, altura y peso.</li>
            <li><strong>Tests psicométricos:</strong> resultados de evaluaciones psicológicas validadas.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Cómo usamos tus datos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Seguimiento personalizado:</strong> para generar tu dashboard de salud, calcular métricas y mostrarte tu progreso en el tiempo.</li>
            <li><strong>Atención profesional:</strong> tus profesionales de salud asignados (nutriólogos, psicólogos, médicos) pueden ver tus datos para optimizar tu atención.</li>
            <li><strong>Inteligencia artificial:</strong> utilizamos IA para generar resúmenes e interpretaciones de tus métricas de salud.</li>
            <li><strong>Investigación anonimizada:</strong> si otorgas tu consentimiento explícito, datos anonimizados pueden usarse para investigación en salud preventiva y longevidad.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Protección de tus datos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tus datos están protegidos con cifrado en tránsito y en reposo.</li>
            <li>Aplicamos políticas de acceso a nivel de fila (Row Level Security) para que solo tú y tus profesionales autorizados puedan ver tu información.</li>
            <li><strong>No vendemos tus datos a terceros.</strong></li>
            <li>No compartimos tu información personal con empresas de publicidad ni marketing.</li>
            <li>Solo tu equipo de salud asignado tiene acceso a tus datos clínicos.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Tus derechos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Puedes solicitar acceso, corrección o eliminación de tus datos personales en cualquier momento.</li>
            <li>Puedes revocar tu consentimiento de investigación desde tu perfil.</li>
            <li>Puedes solicitar una copia de tus datos en formato digital.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta política de privacidad o sobre el manejo de tus datos, contáctanos en:{" "}
            <a href="mailto:redvitalium@gmail.com" className="text-primary hover:underline font-medium">
              redvitalium@gmail.com
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
