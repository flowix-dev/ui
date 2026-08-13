"use client";

import { useState } from "react";
import { ToolCall } from "@/lib/types";

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export default function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [open, setOpen] = useState(false);
  const failed = toolCall.status === "failed";

  return (
    <div className="rounded-lg border border-hairline-strong bg-canvas overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-canvas-soft cursor-pointer"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-body">
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[0.625rem] ${
              failed
                ? "bg-semantic-error/20 text-semantic-error"
                : "bg-semantic-success/20 text-semantic-success"
            }`}
          >
            {failed ? "✕" : "✓"}
          </span>
          <span className="font-mono">{toolCall.name}</span>
        </span>
        <span className="text-muted text-xs">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="border-t border-hairline-soft px-3 py-2 space-y-2">
          <div>
            <p className="text-[0.6875rem] font-medium text-muted uppercase">
              Argumentos
            </p>
            <pre className="mt-1 overflow-auto rounded bg-surface-strong p-2 text-xs text-body">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>
          {failed ? (
            <div>
              <p className="text-[0.6875rem] font-medium text-semantic-error uppercase">
                Error
              </p>
              <pre className="mt-1 overflow-auto rounded bg-semantic-error/10 p-2 text-xs text-semantic-error">
                {toolCall.error ?? "Error"}
              </pre>
            </div>
          ) : (
            <div>
              <p className="text-[0.6875rem] font-medium text-muted uppercase">
                Resultado
              </p>
              <pre className="mt-1 overflow-auto rounded bg-surface-strong p-2 text-xs text-body">
                {JSON.stringify(toolCall.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
