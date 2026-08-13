"use client";

import { useEffect, useMemo, useState } from "react";
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
  setChatModel,
  streamComplete,
  streamDelta,
  streamError,
  streamToolEnd,
  streamToolStart,
  streamUserMessage,
} from "@/store/chatSlice";
import { streamChatMessage } from "@/lib/chatStream";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

export default function ChatLayout() {
  const dispatch = useAppDispatch();
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
  } = useAppSelector((state) => state.chat);

  const generalChats = useMemo(
    () => chats.filter((chat) => !chat.assistantId),
    [chats],
  );

  useEffect(() => {
    dispatch(fetchChats());
    dispatch(fetchModels());
  }, [dispatch]);

  useEffect(() => {
    if (loading || currentChatId || generalChats.length === 0) {
      return;
    }
    const first = generalChats[0];
    dispatch(selectChat(first._id));
    dispatch(fetchChat(first._id));
  }, [loading, currentChatId, generalChats, dispatch]);

  const handleSelectChat = (chatId: string) => {
    dispatch(selectChat(chatId));
    dispatch(fetchChat(chatId));
    setMobileSidebarOpen(false);
  };

  const handleCreateChat = async () => {
    const defaultModel = models[0]?.id;
    const result = await dispatch(createChat({ model: defaultModel }));
    if (createChat.fulfilled.match(result)) {
      dispatch(fetchChat(result.payload._id));
      setMobileSidebarOpen(false);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    dispatch(deleteChat(chatId));
  };

  const handleModelChange = (modelId: string) => {
    if (!currentChatId) {
      return;
    }
    dispatch(setChatModel({ chatId: currentChatId, model: modelId }));
  };

  const handleSend = async (content: string, fileIds: string[]) => {
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
  };

  const sidebar = (
    <ChatSidebar
      chats={generalChats}
      activeChatId={currentChatId}
      loading={loading}
      onSelect={handleSelectChat}
      onCreate={handleCreateChat}
      onDelete={handleDeleteChat}
    />
  );

  return (
    <div className="flex h-[calc(100vh-112px)] md:h-[calc(100vh-56px)]">
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
          onSend={handleSend}
          onModelChange={handleModelChange}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          onCreate={handleCreateChat}
        />
      </main>
    </div>
  );
}
