import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { chatApi, modelApi } from "@/lib/api";
import { Chat, ChatMessage, ChatModel, ToolCall } from "@/lib/types";

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  messages: ChatMessage[];
  models: ChatModel[];
  loading: boolean;
  sending: boolean;
  streaming: boolean;
  streamingText: string;
  streamingToolCalls: ToolCall[];
  error: string | null;
}

const initialState: ChatState = {
  chats: [],
  currentChatId: null,
  currentChat: null,
  messages: [],
  models: [],
  loading: false,
  sending: false,
  streaming: false,
  streamingText: "",
  streamingToolCalls: [],
  error: null,
};

export const fetchChats = createAsyncThunk("chat/fetchChats", async () => {
  const response = await chatApi.list();
  return response.data.chats as Chat[];
});

export const fetchChat = createAsyncThunk(
  "chat/fetchChat",
  async (chatId: string) => {
    const response = await chatApi.get(chatId);
    return {
      chat: response.data.chat as Chat,
      messages: response.data.messages as ChatMessage[],
    };
  },
);

export const createChat = createAsyncThunk(
  "chat/createChat",
  async (input: { title?: string; model?: string }) => {
    const response = await chatApi.create(input);
    return response.data.chat as Chat;
  },
);

export const deleteChat = createAsyncThunk(
  "chat/deleteChat",
  async (chatId: string) => {
    await chatApi.delete(chatId);
    return chatId;
  },
);

export const setChatModel = createAsyncThunk(
  "chat/setChatModel",
  async (input: { chatId: string; model: string }) => {
    const response = await chatApi.update(input.chatId, { model: input.model });
    return response.data.chat as Chat;
  },
);

export const fetchModels = createAsyncThunk("chat/fetchModels", async () => {
  const response = await modelApi.list();
  return response.data.models as ChatModel[];
});

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    selectChat(state, action: PayloadAction<string | null>) {
      state.currentChatId = action.payload;
    },
    clearCurrentChat(state) {
      state.currentChatId = null;
      state.currentChat = null;
      state.messages = [];
      state.streamingText = "";
      state.streamingToolCalls = [];
      state.sending = false;
      state.streaming = false;
    },
    beginStream(state) {
      state.sending = true;
      state.streaming = true;
      state.streamingText = "";
      state.streamingToolCalls = [];
      state.error = null;
    },
    streamUserMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    streamDelta(state, action: PayloadAction<string>) {
      state.streamingText += action.payload;
    },
    streamToolStart(state, action: PayloadAction<ToolCall>) {
      const existing = state.streamingToolCalls.findIndex(
        (call) => call.id === action.payload.id,
      );
      if (existing === -1) {
        state.streamingToolCalls.push(action.payload);
      } else {
        state.streamingToolCalls[existing] = action.payload;
      }
    },
    streamToolEnd(state, action: PayloadAction<ToolCall>) {
      const existing = state.streamingToolCalls.findIndex(
        (call) => call.id === action.payload.id,
      );
      if (existing === -1) {
        state.streamingToolCalls.push(action.payload);
      } else {
        state.streamingToolCalls[existing] = action.payload;
      }
    },
    streamComplete(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
      state.sending = false;
      state.streaming = false;
      state.streamingText = "";
      state.streamingToolCalls = [];
    },
    finishStreaming(state) {
      state.sending = false;
      state.streaming = false;
      if (state.streamingText.trim()) {
        state.messages.push({
          _id: `stream-${Date.now()}`,
          chatId: state.currentChatId ?? "",
          authorId: "",
          role: "assistant",
          content: state.streamingText,
          attachments: [],
          toolCalls: state.streamingToolCalls,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      state.streamingText = "";
      state.streamingToolCalls = [];
    },
    streamError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.sending = false;
      state.streaming = false;
      state.streamingText = "";
      state.streamingToolCalls = [];
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchChat.fulfilled, (state, action) => {
        state.currentChatId = action.payload.chat._id;
        state.currentChat = action.payload.chat;
        state.messages = action.payload.messages;
        state.sending = false;
        state.streaming = false;
        state.streamingText = "";
        state.streamingToolCalls = [];
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.chats = [action.payload, ...state.chats];
        state.currentChatId = action.payload._id;
        state.currentChat = action.payload;
        state.messages = [];
      })
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.chats = state.chats.filter((chat) => chat._id !== action.payload);
        if (state.currentChatId === action.payload) {
          state.currentChatId = null;
          state.currentChat = null;
          state.messages = [];
        }
      })
      .addCase(setChatModel.fulfilled, (state, action) => {
        const updated = action.payload;
        state.chats = state.chats.map((chat) =>
          chat._id === updated._id ? updated : chat,
        );
        if (state.currentChat?._id === updated._id) {
          state.currentChat = updated;
        }
      })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.models = action.payload;
      });
  },
});

export const {
  selectChat,
  clearCurrentChat,
  beginStream,
  streamUserMessage,
  streamDelta,
  streamToolStart,
  streamToolEnd,
  streamComplete,
  finishStreaming,
  streamError,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
