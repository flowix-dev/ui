"use client";

import Link from "next/link";
import { FlowixLogo } from "@/components/marketing/icons";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-hairline bg-canvas">
        <nav className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <FlowixLogo />
            <span className="text-display text-base font-semibold text-ink">
              Flowix
            </span>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-display text-3xl font-semibold text-ink">
          Términos de Servicio
        </h1>
        <p className="mt-2 text-sm text-muted">
          Última actualización: {new Date().toLocaleDateString("es-AR")}
        </p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-body">
          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              1. Aceptación de los términos
            </h2>
            <p>
              Al acceder y usar Flowix, usted acepta estos Términos de Servicio.
              Si no está de acuerdo con alguno de estos términos, no debe usar
              nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              2. Descripción del servicio
            </h2>
            <p>
              Flowix es una plataforma de automatización que permite crear
              workflows visuales, asistentes de IA y chatbots. Los usuarios
              pueden conectar diferentes servicios, crear flujos automatizados y
              interactuar con modelos de inteligencia artificial.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              3. Cuenta de usuario
            </h2>
            <p>
              Para usar ciertos servicios, debe crear una cuenta. Usted es
              responsable de mantener la confidencialidad de su contraseña y de
              todas las actividades que ocurran bajo su cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              4. Uso aceptable
            </h2>
            <p>Usted acepta no:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Usar el servicio para fines ilegales o no autorizados.</li>
              <li>Intentar acceder a sistemas o datos de otros usuarios.</li>
              <li>Interferir con el funcionamiento del servicio.</li>
              <li>Enviar spam, malware o contenido malicioso.</li>
              <li>
                Usar el servicio para crear bots que envíen mensajes no
                solicitados.
              </li>
              <li>Revender o redistribuir el servicio sin autorización.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              5. Propiedad intelectual
            </h2>
            <p>
              El servicio y su contenido original son propiedad de Flowix y
              están protegidos por leyes de propiedad intelectual. Los
              workflows, asistentes y chatbots que usted crea son de su
              propiedad.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              6. Contenido del usuario
            </h2>
            <p>
              Usted retiene todos los derechos sobre el contenido que crea en
              Flowix. Nos otorga una licencia limitada para procesar y almacenar
              su contenido únicamente para proveer el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              7. Pagos y facturación
            </h2>
            <p>
              Los servicios gratuitos tienen limitaciones de uso. Los planes de
              pago se facturan según los precios publicados. Los reembolsos se
              procesan dentro de los primeros 14 días según nuestra política.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              8. Limitación de responsabilidad
            </h2>
            <p>
              Flowix no será responsable de daños indirectos, incidentales o
              consecuentes que resulten del uso del servicio. No garantizamos
              que el servicio será ininterrumpido o libre de errores.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              9. Terminación
            </h2>
            <p>
              Podemos suspender o terminate su cuenta si viola estos términos.
              Usted puede cancelar su cuenta en cualquier momento desde la
              configuración de su perfil.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              10. Cambios en los términos
            </h2>
            <p>
              Nos reservamos el derecho de modificar estos términos. Los cambios
              significativos serán notificados por email con al menos 30 días de
              anticipación.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              11. Contacto
            </h2>
            <p>
              Si tiene preguntas sobre estos términos, contactenos a{" "}
              <a
                href="mailto:legal@basilioalvarez.com"
                className="text-link hover:underline"
              >
                legal@basilioalvarez.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
