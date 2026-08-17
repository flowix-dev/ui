"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import ChatbotForm from "@/components/chatbots/ChatbotForm";
import EmbedSnippet from "@/components/chatbots/EmbedSnippet";
import { chatbotsApi, modelApi } from "@/lib/api";
import { Chatbot, ChatModel } from "@/lib/types";

export default function ChatbotsPage() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [models, setModels] = useState<ChatModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Chatbot | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewingSnippet, setViewingSnippet] = useState<Chatbot | null>(null);

  const refresh = () => {
    chatbotsApi.list().then(({ data }) => setChatbots(data.chatbots));
  };

  useEffect(() => {
    Promise.all([chatbotsApi.list(), modelApi.list()])
      .then(([c, m]) => {
        setChatbots(c.data.chatbots);
        setModels(m.data.models);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (chatbot: Chatbot) => {
    if (!confirm(`¿Eliminar "${chatbot.name}"?`)) {
      return;
    }
    try {
      await chatbotsApi.delete(chatbot._id);
      refresh();
    } catch {
      alert("No se pudo eliminar el chatbot");
    }
  };

  const showForm = creating || editing !== null;

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-24 sm:px-6 md:pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-display text-2xl text-ink">Chatbots</h1>
            <div className="mt-3 w-16 flow-line" aria-hidden="true" />
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            className="btn-primary"
          >
            + Nuevo chatbot
          </button>
        </div>

        {showForm && (
          <div className="mb-6">
            <ChatbotForm
              initial={creating ? null : editing}
              models={models}
              onSave={(chatbot) => {
                setCreating(false);
                setEditing(chatbot);
                refresh();
              }}
              onCancel={() => {
                setCreating(false);
                setEditing(null);
              }}
            />
          </div>
        )}

        {viewingSnippet && (
          <div className="mb-6">
            <EmbedSnippet chatbot={viewingSnippet} />
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-muted">Cargando…</div>
        ) : chatbots.length === 0 ? (
          !showForm && (
            <div className="rounded-lg border border-hairline-strong bg-surface-card py-12 text-center shadow-soft">
              <p className="mb-4 text-sm text-body">
                Todavía no hay chatbots. Creá uno con su prompt, modelo, tools y
                configuración del widget para incrustarlo en tu página.
              </p>
              <button
                onClick={() => {
                  setEditing(null);
                  setCreating(true);
                }}
                className="btn-primary"
              >
                Crear tu primer chatbot
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {chatbots.map((chatbot) => (
              <div
                key={chatbot._id}
                className="flex flex-col rounded-lg border border-hairline-strong bg-surface-card p-5 shadow-soft"
              >
                <div className="flex items-start justify-between">
                  <h2 className="text-display text-base text-ink">
                    {chatbot.name}
                  </h2>
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: chatbot.primaryColor }}
                    title="Color del widget"
                  />
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-body">
                  {chatbot.systemPrompt}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  <span className="badge-pill">{chatbot.model}</span>
                  <span className="badge-pill">
                    {chatbot.tools.length} tool
                    {chatbot.tools.length !== 1 ? "s" : ""}
                  </span>
                  <span className="badge-pill">
                    {chatbot.files.length} archivo
                    {chatbot.files.length !== 1 ? "s" : ""}
                  </span>
                  {chatbot.allowFileUpload && (
                    <span className="badge-pill">Sube archivos</span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-3 border-t border-hairline pt-3">
                  <button
                    onClick={() => router.push(`/chatbots/${chatbot._id}`)}
                    className="btn-primary"
                  >
                    Probar
                  </button>
                  <button
                    onClick={() => setViewingSnippet(chatbot)}
                    className="btn-secondary"
                  >
                    Código
                  </button>
                  <button
                    onClick={() => {
                      setCreating(false);
                      setEditing(chatbot);
                    }}
                    className="btn-secondary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(chatbot)}
                    className="ml-auto text-sm text-semantic-error hover:underline cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
