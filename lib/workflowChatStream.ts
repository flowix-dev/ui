import api from "./api";

export interface WorkflowChatToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  output?: unknown;
  error?: string;
  status: "completed" | "failed";
}

export interface WorkflowChatEvent {
  type: string;
  data: Record<string, unknown>;
}

function getAuthHeaders(): Record<string, string> {
  return {};
}

export function streamWorkflowChat(
  workflowId: string,
  content: string,
  onEvent: (event: WorkflowChatEvent) => void,
  onError?: (error: Error) => void,
): () => void {
  let cancelled = false;
  let controller: AbortController | null = null;

  const run = async (): Promise<void> => {
    controller = new AbortController();

    try {
      const baseUrl = api.defaults.baseURL ?? "";
      const response = await fetch(
        `${baseUrl}/workflow-chat/${workflowId}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ content }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || cancelled) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (!cancelled) {
                onEvent({ type: eventType || "unknown", data: parsed });
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      if (!cancelled && error instanceof Error && error.name !== "AbortError") {
        onError?.(error);
      }
    }
  };

  run();

  return () => {
    cancelled = true;
    controller?.abort();
  };
}
