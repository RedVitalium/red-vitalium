import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FlaskConical, Lock, UserCheck } from "lucide-react";

interface ConsentResult {
  generalConsent: boolean;
  researchConsent: boolean;
}

interface InformedConsentDialogProps {
  open: boolean;
  onAccept: (consent: ConsentResult) => void;
  onCancel: () => void;
}

export function InformedConsentDialog({ open, onAccept, onCancel }: InformedConsentDialogProps) {
  const [accepted, setAccepted] = useState(false);
  const [researchAccepted, setResearchAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept({ generalConsent: true, researchConsent: researchAccepted });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[80vh] flex flex-col p-0 gap-0">        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-display font-bold text-foreground">
              Consentimiento Informado
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Por favor lee y acepta los siguientes términos antes de registrarte en Red Vitalium.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto px-6 py-4 min-h-0">
          <div className="space-y-5 text-sm text-foreground/90 pr-1">

            {/* Section 1 */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-primary shrink-0" />
                <h3 className="font-semibold text-foreground">1. Finalidad de la Plataforma</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Red Vitalium es una plataforma digital de salud y bienestar que facilita el seguimiento de hábitos, métricas de longevidad y composición corporal. Su uso es voluntario y complementario a la atención médica profesional, sin sustituirla en ningún caso.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-primary shrink-0" />
                <h3 className="font-semibold text-foreground">2. Recolección y Uso de Datos de Salud</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Al registrarte, autorizas a Red Vitalium a recopilar y procesar los siguientes tipos de datos:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Datos de perfil: nombre, fecha de nacimiento, sexo, peso, talla.</li>
                <li>Métricas de salud: composición corporal, biomarcadores, frecuencia cardíaca.</li>
                <li>Hábitos y bienestar: sueño, actividad física, nutrición, estado psicológico.</li>
                <li>Resultados de evaluaciones psicométricas realizadas dentro de la plataforma.</li>
                <li>Datos sincronizados desde dispositivos de salud o aplicaciones de terceros (si el usuario lo autoriza).</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Estos datos se utilizan para personalizar tu experiencia, generar reportes de evolución y facilitar la comunicación con los profesionales de salud que hayas vinculado en la plataforma.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="h-4 w-4 text-primary shrink-0" />
                <h3 className="font-semibold text-foreground">3. Uso en Investigación Científica</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Con tu consentimiento, Red Vitalium podrá utilizar tus datos de salud con fines de investigación científica y mejora de la plataforma, bajo las siguientes condiciones estrictas:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li><strong className="text-foreground">Anonimización total:</strong> tus datos serán irreversiblemente disociados de cualquier información que permita tu identificación personal antes de ser utilizados en cualquier análisis o publicación.</li>
                <li><strong className="text-foreground">Uso agregado:</strong> los análisis se realizan sobre conjuntos de datos poblacionales, nunca sobre registros individuales identificables.</li>
                <li><strong className="text-foreground">Sin cesión comercial:</strong> los datos no serán vendidos ni cedidos a terceros con fines comerciales o publicitarios.</li>
                <li><strong className="text-foreground">Propósito científico:</strong> la investigación se orienta a mejorar la comprensión de la longevidad, hábitos saludables y bienestar poblacional.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="font-semibold text-foreground mb-2">4. Confidencialidad y Seguridad</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tus datos se almacenan de forma cifrada y con acceso restringido. Solo los profesionales de salud que hayas vinculado explícitamente podrán acceder a tu información clínica. Cumplimos con las normativas aplicables de protección de datos personales de salud.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h3 className="font-semibold text-foreground mb-2">5. Derechos del Usuario</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                En todo momento tienes derecho a:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Acceder, rectificar o eliminar tus datos personales.</li>
                <li>Revocar tu consentimiento para el uso de datos en investigación (sin afectar el uso operativo de la plataforma).</li>
                <li>Solicitar la portabilidad de tus datos.</li>
                <li>Desvincular a cualquier profesional de salud en cualquier momento.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Para ejercer estos derechos, puedes contactarnos a través de la sección de configuración de tu perfil o escribirnos a <span className="text-primary font-medium">privacidad@redvitalium.com</span>.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h3 className="font-semibold text-foreground mb-2">6. Responsabilidad y Limitaciones</h3>
              <p className="text-muted-foreground leading-relaxed">
                Red Vitalium no proporciona diagnósticos médicos ni reemplaza la consulta con profesionales de salud certificados. La plataforma es una herramienta de apoyo y seguimiento. Cualquier decisión clínica debe ser tomada junto con tu médico u otro profesional de salud habilitado.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h3 className="font-semibold text-foreground mb-2">7. Actualizaciones de estos Términos</h3>
              <p className="text-muted-foreground leading-relaxed">
                Podemos actualizar estos términos en el futuro. Te notificaremos con anticipación ante cualquier cambio relevante. El uso continuado de la plataforma tras la notificación implicará tu aceptación de los nuevos términos.
              </p>
            </section>

            <p className="text-xs text-muted-foreground border-t border-border/50 pt-4">
              Última actualización: febrero 2026 · Red Vitalium Health Technologies
            </p>
          </div>
        </ScrollArea>

        {/* Footer with checkbox and buttons */}
        <div className="px-6 py-3 border-t border-border/50 bg-muted/20 shrink-0 space-y-3">          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              id="consent-check"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(!!v)}
              className="mt-0.5 shrink-0"
            />
            <span className="text-xs text-foreground leading-snug select-none">              He leído y comprendido los términos anteriores. Autorizo a Red Vitalium a recopilar mis datos de salud para el funcionamiento de la plataforma.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              id="research-consent-check"
              checked={researchAccepted}
              onCheckedChange={(v) => setResearchAccepted(!!v)}
              className="mt-0.5 shrink-0"
            />
            <span className="text-xs text-foreground/80 leading-snug select-none">              Autorizo el uso de mis datos anonimizados para fines de investigación científica, incluyendo estudios actuales y futuros que Red Vitalium pueda realizar. Entiendo que: (a) mis datos serán desidentificados antes de cualquier análisis, (b) puedo retirar mi consentimiento de investigación en cualquier momento sin afectar mi participación en el programa clínico, (c) los resultados podrán ser publicados en revistas científicas sin incluir información que me identifique.
            </span>
          </label>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={!accepted}
              onClick={handleAccept}
            >
              Aceptar y Registrarme
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
