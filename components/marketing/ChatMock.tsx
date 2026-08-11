import { ArrowUpIcon } from "./icons";

type ChatMockProps = {
  className?: string;
};

export default function ChatMock({ className = "" }: ChatMockProps) {
  return (
    <div
      className={`overflow-hidden rounded-[1.5rem] border border-hairline-strong bg-surface-card shadow-soft ${className}`}
    >
      <div className="flex items-center gap-2.5 border-b border-hairline px-3 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-strong">
          <span className="h-2 w-2 rounded-full bg-accent-link-bright" />
        </span>
        <div className="flex-1 text-left">
          <p className="text-xs font-semibold text-ink">Asistente IA</p>
          <p className="text-[0.625rem] text-muted">En línea</p>
        </div>
      </div>

      <div className="space-y-2 px-3 py-3 text-left">
        <div className="max-w-[85%] rounded-md rounded-tl-sm bg-surface-strong px-2.5 py-1.5 text-xs leading-relaxed text-body">
          He revisado tus ventas de julio.
        </div>
        <div className="ml-auto max-w-[85%] rounded-md rounded-tr-sm bg-primary px-2.5 py-1.5 text-xs leading-relaxed text-on-primary">
          Envíame un resumen diario.
        </div>
        <div className="max-w-[85%] rounded-md rounded-tl-sm bg-surface-strong px-2.5 py-1.5 text-xs leading-relaxed text-body">
          Listo. Lo tendrás cada mañana a las 8:00.
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-hairline px-3 py-2">
        <span className="flex-1 rounded-md border border-hairline-strong px-2.5 py-1.5 text-left text-[0.625rem] text-muted-soft">
          Escribe un mensaje…
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-on-primary">
          <ArrowUpIcon className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
