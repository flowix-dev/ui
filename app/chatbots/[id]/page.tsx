"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { chatbotsApi } from "@/lib/api";
import { Chatbot } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  beginStream,
  clearError,
  createChat,
  deleteChat,
  fetchChat,
  fetchChats,
  fetchModels,
  finishStreaming,
  selectChat,
  streamComplete,
  streamDelta,
  streamError,
  streamToolEnd,
  streamToolStart,
  streamUserMessage,
} from "@/store/chatSlice";
import { streamChatMessage } from "@/lib/chatStream";

export default function ChatbotChatPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const chatbotId = params.id as string;

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const {
    chats,
    currentChatId,
    currentChat,
    messages,
    models,
    loading,
    sending,
    streaming,
    streamingText,
    streamingToolCalls,
    error,
  } = useAppSelector((s) => s.chat);

  useEffect(() => {
    chatbotsApi
      .get(chatbotId)
      .then(({ data }) => setChatbot(data.chatbot))
      .catch(() => {});
  }, [chatbotId]);

  useEffect(() => {
    dispatch(fetchChats());
    dispatch(fetchModels());
  }, [dispatch]);

  const chatbotChats = useMemo(
    () => chats.filter((chat) => chat.chatbotId === chatbotId),
    [chats, chatbotId],
  );

  useEffect(() => {
    if (chatbotChats.length === 0) {
      return;
    }
    if (
      currentChatId &&
      chatbotChats.some((chat) => chat._id === currentChatId)
    ) {
      return;
    }
    const first = chatbotChats[0];
    dispatch(selectChat(first._id));
    dispatch(fetchChat(first._id));
  }, [chatbotChats, currentChatId, dispatch]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      dispatch(selectChat(chatId));
      dispatch(fetchChat(chatId));
      setMobileSidebarOpen(false);
    },
    [dispatch],
  );

  const handleCreateChat = useCallback(async () => {
    const result = await dispatch(createChat({ chatbotId }));
    if (createChat.fulfilled.match(result)) {
      dispatch(fetchChat(result.payload._id));
      setMobileSidebarOpen(false);
    }
  }, [chatbotId, dispatch]);

  const handleDeleteChat = useCallback(
    (chatId: string) => {
      dispatch(deleteChat(chatId));
    },
    [dispatch],
  );

  const handleSend = useCallback(
    async (content: string, fileIds: string[]) => {
      if (!currentChatId) {
        return;
      }
      dispatch(clearError());
      dispatch(beginStream());
      try {
        await streamChatMessage(currentChatId, content, fileIds, {
          onUserMessage: (message) => dispatch(streamUserMessage(message)),
          onDelta: (text) => dispatch(streamDelta(text)),
          onToolStart: (toolCall) => dispatch(streamToolStart(toolCall)),
          onToolEnd: (toolCall) => dispatch(streamToolEnd(toolCall)),
          onComplete: (message) => dispatch(streamComplete(message)),
          onError: (message) => dispatch(streamError(message)),
        });
      } finally {
        dispatch(finishStreaming());
      }
    },
    [currentChatId, dispatch],
  );

  const sidebar = (
    <ChatSidebar
      chats={chatbotChats}
      activeChatId={currentChatId}
      loading={loading}
      onSelect={handleSelectChat}
      onCreate={handleCreateChat}
      onDelete={handleDeleteChat}
    />
  );

  return (
    <AuthGuard>
      <Navbar />
      <div className="flex h-[calc(100vh-112px)] flex-col md:h-[calc(100vh-56px)]">
        <header className="flex shrink-0 items-center gap-3 border-b border-hairline-strong bg-surface-card px-4 py-2.5">
          <button
            onClick={() => router.push("/chatbots")}
            className="cursor-pointer text-sm text-link hover:underline"
          >
            ← Chatbots
          </button>
          <span className="text-muted">/</span>
          <h1 className="truncate text-display text-base text-ink">
            {chatbot?.name ?? "Chatbot"}
          </h1>
          <button
            onClick={() => setMobileSidebarOpen((v) => !v)}
            className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-body hover:bg-surface-strong md:hidden"
            title="Lista de chats"
            aria-label="Lista de chats"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-64 shrink-0 border-r border-hairline-strong bg-canvas-soft md:block">
            {sidebar}
          </aside>

          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <div
                className="absolute left-0 top-0 h-full w-72 bg-canvas shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                {sidebar}
              </div>
            </div>
          )}

          <main className="min-w-0 flex-1">
            <ChatWindow
              chat={currentChat}
              messages={messages}
              models={models}
              sending={sending}
              streaming={streaming}
              streamingText={streamingText}
              streamingToolCalls={streamingToolCalls}
              error={error}
              hideModelSelector
              onSend={handleSend}
              onModelChange={() => {}}
              onOpenSidebar={() => setMobileSidebarOpen(true)}
              onCreate={handleCreateChat}
            />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
