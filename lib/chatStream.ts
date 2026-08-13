import axios from "axios";
import { ChatMessage, ToolCall } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface StreamHandlers {
  onUserMessage?: (message: ChatMessage) => void;
  onDelta?: (text: string) => void;
  onToolStart?: (toolCall: ToolCall) => void;
  onToolEnd?: (toolCall: ToolCall) => void;
  onComplete?: (message: ChatMessage) => void;
  onError?: (message: string) => void;
}

interface StreamEvent {
  event: string;
  data: unknown;
}

function parseSseBuffer(buffer: string): {
  events: StreamEvent[];
  rest: string;
} {
  const events: StreamEvent[] = [];
  let rest = buffer;
  let index: number;

  while ((index = rest.indexOf("\n\n")) !== -1) {
    const raw = rest.slice(0, index);
    rest = rest.slice(index + 2);
    let eventName = "message";
    let data = "";
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data += line.slice(5).trim();
      }
    }
    if (!data) {
      continue;
    }
    try {
      events.push({ event: eventName, data: JSON.parse(data) });
    } catch {
      continue;
    }
  }

  return { events, rest };
}

async function fetchStream(
  chatId: string,
  content: string,
  fileIds: string[],
  signal?: AbortSignal,
): Promise<Response> {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content, fileIds }),
  };
  if (signal) {
    init.signal = signal;
  }
  const response = await fetch(
    `${API_BASE_URL}/chats/${chatId}/messages`,
    init,
  );

  if (response.status === 401) {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      return fetch(`${API_BASE_URL}/chats/${chatId}/messages`, init);
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  return response;
}

export async function streamChatMessage(
  chatId: string,
  content: string,
  fileIds: string[],
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetchStream(chatId, content, fileIds, signal);
  } catch (error) {
    handlers.onError?.(
      error instanceof Error
        ? error.message
        : "No se pudo conectar con el servidor",
    );
    return;
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    handlers.onError?.(body?.message ?? "Failed to send message");
    return;
  }

  if (!response.body) {
    handlers.onError?.("Empty response");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBuffer(buffer);
      buffer = rest;
      for (const entry of events) {
        switch (entry.event) {
          case "message.started":
            handlers.onUserMessage?.(
              (entry.data as { message: ChatMessage }).message,
            );
            break;
          case "content.delta":
            handlers.onDelta?.((entry.data as { text: string }).text);
            break;
          case "tool.started":
            handlers.onToolStart?.(
              (entry.data as { toolCall: ToolCall }).toolCall,
            );
            break;
          case "tool.finished":
            handlers.onToolEnd?.(
              (entry.data as { toolCall: ToolCall }).toolCall,
            );
            break;
          case "message.completed":
            handlers.onComplete?.(
              (entry.data as { message: ChatMessage }).message,
            );
            break;
          case "error":
            handlers.onError?.((entry.data as { message: string }).message);
            break;
          default:
            break;
        }
      }
    }

    const { events } = parseSseBuffer(buffer);
    for (const entry of events) {
      if (entry.event === "message.completed") {
        handlers.onComplete?.((entry.data as { message: ChatMessage }).message);
      } else if (entry.event === "error") {
        handlers.onError?.((entry.data as { message: string }).message);
      }
    }
  } catch (error) {
    handlers.onError?.(
      error instanceof Error
        ? error.message
        : "La conexión con el servidor se interrumpió",
    );
  } finally {
    reader.releaseLock();
  }
}
