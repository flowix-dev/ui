"use client";

import { useEffect, useRef } from "react";
import { ChatMessage, ToolCall } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import ToolCallCard from "./ToolCallCard";
import MarkdownRenderer from "./MarkdownRenderer";

interface MessageListProps {
  messages: ChatMessage[];
  streaming: boolean;
  streamingText: string;
  streamingToolCalls: ToolCall[];
}

export default function MessageList({
  messages,
  streaming,
  streamingText,
  streamingToolCalls,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText, streamingToolCalls, streaming]);

  if (messages.length === 0 && !streaming) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl text-on-primary">
          ✨
        </div>
        <h2 className="text-lg font-semibold text-ink">
          Empieza una conversación
        </h2>
        <p className="max-w-sm text-sm text-muted">
          Pregúntale lo que quieras, sube archivos o pídele que ejecute una
          herramienta como sumar números, consultar una URL o enviar un correo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
      {messages.map((message) => (
        <MessageBubble key={message._id} message={message} />
      ))}

      {streaming && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl bg-surface-strong px-4 py-2.5 text-sm text-ink">
            {streamingToolCalls.length > 0 && (
              <div className="mb-2 space-y-1.5">
                {streamingToolCalls.map((toolCall) => (
                  <ToolCallCard key={toolCall.id} toolCall={toolCall} />
                ))}
              </div>
            )}
            {streamingText ? (
              <MarkdownRenderer content={streamingText} />
            ) : (
              <div className="flex items-center gap-1 py-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
