"use client";

import Link from "next/link";
import { FlowixLogo } from "@/components/marketing/icons";

export default function PrivacyPage() {
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
          Política de Privacidad
        </h1>
        <p className="mt-2 text-sm text-muted">
          Última actualización: {new Date().toLocaleDateString("es-AR")}
        </p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-body">
          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              1. Información que recopilamos
            </h2>
            <p>
              Recopilamos información que usted nos proporciona directamente al
              crear una cuenta, usar nuestros servicios o comunicarse con
              nosotros. Esto incluye:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Nombre, dirección de correo electrónico y contraseña al
                registrarse.
              </li>
              <li>
                Contenido de workflows, asistentes y chatbots que usted crea.
              </li>
              <li>
                Archivos que sube para procesamiento (CVs, documentos, etc.).
              </li>
              <li>Mensajes enviados a chatbots y asistentes.</li>
              <li>Información de facturación si adquiere un plan de pago.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              2. Uso de la información
            </h2>
            <p>Utilizamos su información para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Proveer, mantener y mejorar nuestros servicios.</li>
              <li>Procesar sus workflows y ejecutar automatizaciones.</li>
              <li>Enviar notificaciones sobre su cuenta y servicios.</li>
              <li>Comunicarnos con usted para soporte técnico.</li>
              <li>Prevenir fraude y abusos de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              3. Almacenamiento y seguridad
            </h2>
            <p>
              Sus datos se almacenan en servidores seguros. Utilizamos
              encriptación en tránsito (TLS) y en reposo. No vendemos ni
              compartimos su información personal con terceros para fines de
              marketing.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              4. Servicios de terceros
            </h2>
            <p>
              Utilizamos proveedores de servicios de terceros para operar
              nuestra plataforma, incluyendo:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Proveedores de infraestructura cloud (servidores, bases de
                datos).
              </li>
              <li>
                Proveedores de modelos de IA para procesar prompts y generar
                respuestas.
              </li>
              <li>Servicios de email para notificaciones transaccionales.</li>
            </ul>
            <p>
              Estos proveedores acceden a su información únicamente para
              realizar servicios en nuestro nombre y están obligados a
              protegerla.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              5. Cookies
            </h2>
            <p>
              Utilizamos cookies esenciales para mantener su sesión activa y
              autenticarlo. No utilizamos cookies de rastreo publicitario.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              6. Sus derechos
            </h2>
            <p>
              Usted puede acceder, actualizar o eliminar su información personal
              desde su perfil. También puede solicitar la exportación o
              eliminación completa de sus datos contactándonos.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              7. Retención de datos
            </h2>
            <p>
              Conservamos su información mientras su cuenta esté activa. Si
              elimina su cuenta, sus datos se eliminan de manera permanente
              dentro de los 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              8. Cambios en esta política
            </h2>
            <p>
              Nos reservamos el derecho de actualizar esta política. Le
              notificaremos por email sobre cambios significativos.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold text-ink">
              9. Contacto
            </h2>
            <p>
              Si tiene preguntas sobre esta política, contactenos a{" "}
              <a
                href="mailto:privacy@basilioalvarez.com"
                className="text-link hover:underline"
              >
                privacy@basilioalvarez.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
