import Link from "next/link";
import { FlowixLogo } from "./icons";

interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Producto",
    links: [
      { label: "Workflows", href: "#workflows" },
      { label: "Asistentes", href: "#asistentes" },
      { label: "Chatbots", href: "#chatbots" },
      { label: "Modelos", href: "#modelos" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Documentación", href: "#" },
      { label: "Referencia de API", href: "#" },
      { label: "Guía de inicio", href: "#" },
      { label: "Estado", href: "#" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { label: "Acerca de", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contacto", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: "#" },
      { label: "Términos", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-on-primary">
                <FlowixLogo />
              </span>
              <span className="text-display text-base font-semibold text-ink">
                Flowix
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-body">
              Automatización, asistentes y chat con IA para equipos que
              prefieren construir rápido.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-ink">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-body transition hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Flowix. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted">
            Hecho para equipos que construyen rápido.
          </p>
        </div>
      </div>
    </footer>
  );
}
