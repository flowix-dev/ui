import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import SectionHeading from "./SectionHeading";
import {
  WorkflowIcon,
  AssistantIcon,
  ChatbotIcon,
  ChatIcon,
  ArrowRightIcon,
} from "./icons";

interface Feature {
  id: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    id: "workflows",
    icon: WorkflowIcon,
    title: "Workflows de automatización",
    body: "Diseña flujos visuales que conectan disparadores, llamadas HTTP, IA y notificaciones, y ejecútalos en segundos.",
  },
  {
    id: "asistentes",
    icon: AssistantIcon,
    title: "Asistentes",
    body: "Crea asistentes con instrucciones y contexto propios para delegar tareas repetitivas y recuperar horas cada día.",
  },
  {
    id: "chatbots",
    icon: ChatbotIcon,
    title: "Chatbots",
    body: "Publica chatbots que atienden a tus usuarios con el tono y el conocimiento de tu producto.",
  },
  {
    id: "modelos",
    icon: ChatIcon,
    title: "Chat con modelos",
    body: "Conversa directamente con los modelos más avanzados desde un mismo lugar, sin configuración compleja.",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="Qué puedes crear"
        title="Todo lo que necesitas para construir con IA"
        description="Cuatro bloques que se combinan entre sí para resolver tareas reales de principio a fin."
      />
      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <article
            key={feature.id}
            id={feature.id}
            className="flex flex-col rounded-lg border border-hairline-strong bg-surface-card p-6 text-left shadow-soft"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-strong">
              <feature.icon className="h-4 w-4 text-ink" />
            </span>
            <h3 className="mt-4 text-[1.125rem] font-semibold text-ink">
              {feature.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
              {feature.body}
            </p>
            <Link
              href="/register"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline"
            >
              Empezar
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
