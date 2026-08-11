import Link from "next/link";
import SectionHeading from "./SectionHeading";
import { ArrowRightIcon, CheckIcon } from "./icons";

const POINTS = [
  "Disparadores: horarios, webhooks y eventos",
  "Nodos de IA: chat, resumen y clasificación",
  "Integraciones: HTTP, S3, SQS y email",
  "Ejecuciones con logs, reintentos y estado en vivo",
];

interface SnippetToken {
  text: string;
  className: string;
}

const KEY_CLASS = "text-accent-link-bright";
const STRING_CLASS = "text-semantic-success";
const PUNCT_CLASS = "text-on-dark";
const PLAIN_CLASS = "text-on-dark-soft";

const SNIPPET: SnippetToken[][] = [
  [{ text: "{", className: PUNCT_CLASS }],
  [
    { text: '  "name"', className: KEY_CLASS },
    { text: ": ", className: PLAIN_CLASS },
    { text: '"Resumen diario"', className: STRING_CLASS },
    { text: ",", className: PUNCT_CLASS },
  ],
  [
    { text: '  "trigger"', className: KEY_CLASS },
    { text: ": ", className: PLAIN_CLASS },
    { text: '"cron 0 8 * * *"', className: STRING_CLASS },
    { text: ",", className: PUNCT_CLASS },
  ],
  [
    { text: '  "steps"', className: KEY_CLASS },
    { text: ": ", className: PLAIN_CLASS },
    { text: "[", className: PUNCT_CLASS },
  ],
  [
    { text: "    { ", className: PUNCT_CLASS },
    { text: '"type"', className: KEY_CLASS },
    { text: ": ", className: PLAIN_CLASS },
    { text: '"http"', className: STRING_CLASS },
    { text: ", ", className: PLAIN_CLASS },
    { text: '"method"', className: KEY_CLASS },
    { text: ": ", className: PLAIN_CLASS },
    { text: '"GET"', className: STRING_CLASS },
    { text: " },", className: PUNCT_CLASS },
  ],
  [
    { text: "    { ", className: PUNCT_CLASS },
    { text: '"type"', className: KEY_CLASS },
    { text: ": ", className: PLAIN_CLASS },
    { text: '"chat"', className: STRING_CLASS },
    { text: ", ", className: PLAIN_CLASS },
    { text: '"model"', className: KEY_CLASS },
    { text: ": ", className: PLAIN_CLASS },
    { text: '"gpt-4o"', className: STRING_CLASS },
    { text: " },", className: PUNCT_CLASS },
  ],
  [
    { text: "    { ", className: PUNCT_CLASS },
    { text: '"type"', className: KEY_CLASS },
    { text: ": ", className: PLAIN_CLASS },
    { text: '"notify"', className: STRING_CLASS },
    { text: ", ", className: PLAIN_CLASS },
    { text: '"channel"', className: KEY_CLASS },
    { text: ": ", className: PLAIN_CLASS },
    { text: '"slack"', className: STRING_CLASS },
    { text: " }", className: PUNCT_CLASS },
  ],
  [{ text: "  ]", className: PUNCT_CLASS }],
  [{ text: "}", className: PUNCT_CLASS }],
];

function CodeMock() {
  return (
    <div className="overflow-hidden rounded-lg bg-surface-dark">
      <div className="flex items-center gap-2 border-b border-surface-dark-elevated px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-semantic-error" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent-warning" />
        <span className="h-2.5 w-2.5 rounded-full bg-semantic-success" />
        <span className="ml-2 font-mono text-xs text-on-dark-soft">
          workflow.json
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-relaxed text-on-dark-soft">
        {SNIPPET.map((line, lineIndex) => (
          <span key={lineIndex}>
            {line.map((token, tokenIndex) => (
              <span key={tokenIndex} className={token.className}>
                {token.text}
              </span>
            ))}
            {lineIndex < SNIPPET.length - 1 ? "\n" : ""}
          </span>
        ))}
      </pre>
    </div>
  );
}

export default function CodeSection() {
  return (
    <section className="border-t border-hairline bg-canvas-soft">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Cómo funciona"
            title="Tu flujo, en el editor visual o en código"
            description="Cada workflow es un documento versionable que puedes construir arrastrando nodos, generar con IA o editar a mano."
          />
          <ul className="mt-8 space-y-3">
            {POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-3 text-sm text-body"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-strong">
                  <CheckIcon className="h-3 w-3 text-ink" />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <Link href="/register" className="btn-secondary mt-9">
            Construir mi primer workflow
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <CodeMock />
      </div>
    </section>
  );
}
