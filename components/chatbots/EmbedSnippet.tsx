"use client";

import { useState } from "react";
import { Chatbot } from "@/lib/types";
import { chatbotsApi } from "@/lib/api";

interface EmbedSnippetProps {
  chatbot: Chatbot;
}

export default function EmbedSnippet({ chatbot }: EmbedSnippetProps) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const snippet = `<script src="${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"}/chatbots/${chatbot._id}/embed.js" data-token="${chatbot.publicToken}" data-chatbot="${chatbot._id}" async></script>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("No se pudo copiar el snippet");
    }
  };

  const handleRegenerate = async () => {
    if (
      !confirm(
        "Al regenerar el token, el snippet actual dejará de funcionar y deberás actualizarlo en tu página. ¿Continuar?",
      )
    ) {
      return;
    }
    setRegenerating(true);
    try {
      await chatbotsApi.regenerateToken(chatbot._id);
      alert("Token regenerado. Actualizá el snippet en tu página.");
    } catch {
      alert("No se pudo regenerar el token");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="rounded-lg border border-hairline-strong bg-surface-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-display text-sm font-semibold text-ink">
          Código para incrustar
        </h3>
        <button onClick={copy} className="btn-secondary">
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>

      <pre className="max-h-40 overflow-y-auto rounded-md bg-surface-dark p-3 text-xs text-on-dark">
        <code>{snippet}</code>
      </pre>

      <p className="mt-3 text-xs text-muted">
        Pegá este snippet justo antes de cerrar el{" "}
        <code className="rounded bg-surface-strong px-1">&lt;/body&gt;</code> de
        tu página. El widget cargará automáticamente.
      </p>

      <div className="mt-4 flex items-center gap-3 border-t border-hairline pt-3">
        <span className="text-xs text-muted">
          Token público:{" "}
          <code className="rounded bg-surface-strong px-1 font-mono">
            {chatbot.publicToken.slice(0, 12)}…
          </code>
        </span>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="ml-auto text-xs text-semantic-error hover:underline cursor-pointer"
        >
          {regenerating ? "Regenerando…" : "Regenerar token"}
        </button>
      </div>
    </div>
  );
}
