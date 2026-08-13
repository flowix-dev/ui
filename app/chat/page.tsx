"use client";

import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import ChatLayout from "@/components/chat/ChatLayout";

export default function ChatPage() {
  return (
    <AuthGuard>
      <Navbar />
      <ChatLayout />
    </AuthGuard>
  );
}
