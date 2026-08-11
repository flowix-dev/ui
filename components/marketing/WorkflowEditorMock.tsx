import { Fragment } from "react";

interface WorkflowNodeMock {
  kind: string;
  title: string;
  dot: string;
  accent: string;
}

const NODES: WorkflowNodeMock[] = [
  {
    kind: "Disparador",
    title: "Cada día a las 8:00",
    dot: "bg-semantic-success",
    accent: "text-semantic-success",
  },
  {
    kind: "HTTP",
    title: "GET /api/ventas",
    dot: "bg-link",
    accent: "text-link",
  },
  {
    kind: "IA",
    title: "Resumir con el modelo",
    dot: "bg-accent-preview",
    accent: "text-accent-preview",
  },
  {
    kind: "Notificación",
    title: "Enviar a Slack",
    dot: "bg-accent-warning",
    accent: "text-accent-warning",
  },
];

function NodeCard({ node }: { node: WorkflowNodeMock }) {
  return (
    <div className="flex w-60 items-center gap-3 rounded-md border border-hairline-strong bg-surface-card px-3 py-2.5 text-left shadow-soft sm:w-64 lg:w-72">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-strong ${node.accent}`}
      >
        <span className={`h-2 w-2 rounded-full ${node.dot}`} />
      </span>
      <div className="min-w-0">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.055rem] text-muted">
          {node.kind}
        </p>
        <p className="truncate text-xs font-medium text-ink">{node.title}</p>
      </div>
    </div>
  );
}

export default function WorkflowEditorMock() {
  return (
    <div className="flex h-64 items-center justify-center bg-canvas-soft lg:h-72">
      <div className="space-y-3">
        {NODES.map((node, index) => (
          <Fragment key={node.kind}>
            <NodeCard node={node} />
            {index < NODES.length - 1 && (
              <div className="mx-auto h-3 w-px bg-hairline-strong" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
