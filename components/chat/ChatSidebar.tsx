"use client";

import { Chat } from "@/lib/types";

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  loading: boolean;
  onSelect: (chatId: string) => void;
  onCreate: () => void;
  onDelete: (chatId: string) => void;
}

function timeLabel(date: string): string {
  const value = new Date(date).getTime();
  const diff = Date.now() - value;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) {
    return "ahora";
  }
  if (minutes < 60) {
    return `hace ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `hace ${hours} h`;
  }
  return new Date(date).toLocaleDateString();
}

export default function ChatSidebar({
  chats,
  activeChatId,
  loading,
  onSelect,
  onCreate,
  onDelete,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <button onClick={onCreate} className="btn-primary w-full">
          + Nuevo chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <p className="px-2 py-4 text-center text-sm text-muted">Cargando…</p>
        ) : chats.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted">
            Todavía no tienes chats
          </p>
        ) : (
          <ul className="space-y-0.5">
            {chats.map((chat) => {
              const active = chat._id === activeChatId;
              return (
                <li key={chat._id}>
                  <div
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer ${
                      active ? "bg-surface-strong" : "hover:bg-surface-strong"
                    }`}
                    onClick={() => onSelect(chat._id)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {chat.title}
                      </p>
                      <p className="text-[0.6875rem] text-muted">
                        {timeLabel(chat.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (confirm("¿Eliminar este chat?")) {
                          onDelete(chat._id);
                        }
                      }}
                      className="ml-2 shrink-0 rounded p-1 text-muted opacity-0 transition group-hover:opacity-100 hover:text-semantic-error cursor-pointer"
                      title="Eliminar chat"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
