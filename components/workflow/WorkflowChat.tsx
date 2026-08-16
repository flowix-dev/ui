"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  streamWorkflowChat,
  type WorkflowChatToolCall,
} from "@/lib/workflowChatStream";
import api from "@/lib/api";

interface Message {
  _id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: WorkflowChatToolCall[];
}

interface WorkflowChatProps {
  workflowId: string;
  open: boolean;
  onClose: () => void;
}

export default function WorkflowChat({
  workflowId,
  open,
  onClose,
}: WorkflowChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingToolCalls, setStreamingToolCalls] = useState<
    WorkflowChatToolCall[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    if (open) {
      api
        .get(`/workflow-chat/${workflowId}`)
        .then(({ data }) => {
          setMessages(data.messages ?? []);
        })
        .catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, workflowId]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    setStreamingText("");
    setStreamingToolCalls([]);

    const userMessage: Message = {
      _id: `temp-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);

    cancelRef.current = streamWorkflowChat(
      workflowId,
      text,
      (event) => {
        switch (event.type) {
          case "content.delta":
            setStreamingText((prev) => prev + (event.data.delta as string));
            break;
          case "tool.started":
            setStreamingToolCalls((prev) => [
              ...prev,
              {
                id: event.data.id as string,
                name: event.data.name as string,
                arguments:
                  (event.data.arguments as Record<string, unknown>) ?? {},
                status: "completed" as const,
              },
            ]);
            break;
          case "tool.finished":
            setStreamingToolCalls((prev) =>
              prev.map((tc) =>
                tc.id === event.data.id
                  ? {
                      ...tc,
                      output: event.data.output,
                      error: event.data.error as string | undefined,
                      status:
                        (event.data.status as "completed" | "failed") ??
                        "completed",
                    }
                  : tc,
              ),
            );
            break;
          case "message.completed":
            setMessages((prev) => [
              ...prev,
              {
                _id: event.data._id as string,
                role: "assistant" as const,
                content: (event.data.content as string) ?? "",
                toolCalls:
                  (event.data.toolCalls as WorkflowChatToolCall[]) ?? [],
              },
            ]);
            setStreamingText("");
            setStreamingToolCalls([]);
            setSending(false);
            break;
          case "done":
            setSending(false);
            break;
        }
      },
      () => {
        setSending(false);
      },
    );
  }, [input, sending, workflowId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  if (!open) return null;

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-hairline-strong bg-canvas-soft">
      <div className="flex items-center justify-between border-b border-hairline-strong px-4 py-2">
        <h3 className="text-display text-sm font-semibold text-ink">
          Asistente
        </h3>
        <button
          onClick={onClose}
          className="cursor-pointer text-muted transition hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !sending && (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted">
            Pedile al asistente que cree o modifique tu workflow
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg._id} className="mb-4">
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "ml-8 bg-primary text-on-primary"
                  : "mr-8 bg-surface-card text-ink shadow-soft"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.toolCalls?.map((tc) => (
              <div key={tc.id} className="mt-2 ml-4">
                <ToolCallCard toolCall={tc} />
              </div>
            ))}
          </div>
        ))}

        {sending && streamingText && (
          <div className="mb-4">
            <div className="mr-8 rounded-lg bg-surface-card px-3 py-2 text-sm text-ink shadow-soft">
              <div className="whitespace-pre-wrap">{streamingText}</div>
            </div>
          </div>
        )}

        {sending && streamingToolCalls.length > 0 && (
          <div className="mb-4 ml-4">
            {streamingToolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {sending && !streamingText && streamingToolCalls.length === 0 && (
          <div className="mb-4">
            <div className="mr-8 inline-flex items-center gap-1 rounded-lg bg-surface-card px-3 py-2 text-sm text-muted shadow-soft">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:0.2s]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-hairline-strong p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describí lo que querés hacer..."
            rows={2}
            className="flex-1 resize-none rounded-md border border-hairline-strong bg-surface-card px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="btn-primary cursor-pointer self-end disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolCallCard({ toolCall }: { toolCall: WorkflowChatToolCall }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-hairline bg-surface-card p-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-2 text-left"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            toolCall.status === "failed"
              ? "bg-semantic-error"
              : "bg-semantic-success"
          }`}
        />
        <span className="font-medium text-ink">{toolCall.name}</span>
        <span className="ml-auto text-muted">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          <div>
            <span className="font-medium text-muted">Args: </span>
            <span className="font-mono text-body">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </span>
          </div>
          {toolCall.output !== undefined && (
            <div>
              <span className="font-medium text-muted">Output: </span>
              <span className="font-mono text-body">
                {typeof toolCall.output === "string"
                  ? toolCall.output
                  : JSON.stringify(toolCall.output, null, 2)}
              </span>
            </div>
          )}
          {toolCall.error && (
            <div className="text-semantic-error">{toolCall.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
