"use client";

import { Chat, ChatMessage, ChatModel, ToolCall } from "@/lib/types";
import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";
import ModelSelector from "./ModelSelector";

interface ChatWindowProps {
  chat: Chat | null;
  messages: ChatMessage[];
  models: ChatModel[];
  sending: boolean;
  streaming: boolean;
  streamingText: string;
  streamingToolCalls: ToolCall[];
  error: string | null;
  hideModelSelector?: boolean;
  onSend: (content: string, fileIds: string[]) => void;
  onModelChange: (modelId: string) => void;
  onOpenSidebar: () => void;
  onCreate: () => void;
}

export default function ChatWindow({
  chat,
  messages,
  models,
  sending,
  streaming,
  streamingText,
  streamingToolCalls,
  error,
  hideModelSelector = false,
  onSend,
  onModelChange,
  onOpenSidebar,
  onCreate,
}: ChatWindowProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-hairline-strong bg-canvas px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-body hover:bg-surface-strong hover:text-ink md:hidden cursor-pointer"
            title="Lista de chats"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <h1 className="truncate text-base font-semibold text-ink">
            {chat?.title ?? "Chat"}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {chat && !hideModelSelector && (
            <ModelSelector
              models={models}
              value={chat?.model ?? ""}
              onChange={onModelChange}
            />
          )}
        </div>
      </header>

      {!chat ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl text-on-primary">
            ✨
          </div>
          <h2 className="text-lg font-semibold text-ink">
            Crea un chat para empezar
          </h2>
          <p className="max-w-sm text-sm text-muted">
            Pregúntale lo que quieras, sube archivos o pídele que ejecute una
            herramienta como sumar números, consultar una URL o enviar un
            correo.
          </p>
          <button type="button" onClick={onCreate} className="btn-primary">
            + Nuevo chat
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="mx-4 mt-3 rounded-lg bg-semantic-error/10 px-3 py-2 text-sm text-semantic-error">
              {error}
            </div>
          )}

          <MessageList
            messages={messages}
            streaming={streaming}
            streamingText={streamingText}
            streamingToolCalls={streamingToolCalls}
          />

          <ChatComposer
            chatId={chat?._id ?? ""}
            disabled={!chat || sending}
            onSend={onSend}
          />
        </>
      )}
    </div>
  );
}
