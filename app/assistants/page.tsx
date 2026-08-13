"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import AssistantForm from "@/components/assistants/AssistantForm";
import { assistantsApi, modelApi } from "@/lib/api";
import { Assistant, ChatModel } from "@/lib/types";

export default function AssistantsPage() {
  const router = useRouter();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [models, setModels] = useState<ChatModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Assistant | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    assistantsApi.list().then(({ data }) => setAssistants(data.assistants));
  };

  useEffect(() => {
    Promise.all([assistantsApi.list(), modelApi.list()])
      .then(([a, m]) => {
        setAssistants(a.data.assistants);
        setModels(m.data.models);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (assistant: Assistant) => {
    if (!confirm(`¿Eliminar "${assistant.name}"?`)) {
      return;
    }
    try {
      await assistantsApi.delete(assistant._id);
      refresh();
    } catch {
      alert("No se pudo eliminar el asistente");
    }
  };

  const showForm = creating || editing !== null;

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-24 sm:px-6 md:pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-display text-2xl text-ink">Asistentes</h1>
            <div className="mt-3 w-16 flow-line" aria-hidden="true" />
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            className="btn-primary"
          >
            + Nuevo asistente
          </button>
        </div>

        {showForm && (
          <div className="mb-6">
            <AssistantForm
              initial={creating ? null : editing}
              models={models}
              onSave={(assistant) => {
                setCreating(false);
                setEditing(assistant);
                refresh();
              }}
              onCancel={() => {
                setCreating(false);
                setEditing(null);
              }}
            />
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-muted">Cargando…</div>
        ) : assistants.length === 0 ? (
          !showForm && (
            <div className="rounded-lg border border-hairline-strong bg-surface-card py-12 text-center shadow-soft">
              <p className="mb-4 text-sm text-body">
                Todavía no hay asistentes. Creá uno con su prompt, modelo y
                archivos de conocimiento.
              </p>
              <button
                onClick={() => {
                  setEditing(null);
                  setCreating(true);
                }}
                className="btn-primary"
              >
                Crear tu primer asistente
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {assistants.map((assistant) => (
              <div
                key={assistant._id}
                className="flex flex-col rounded-lg border border-hairline-strong bg-surface-card p-5 shadow-soft"
              >
                <div className="flex items-start justify-between">
                  <h2 className="text-display text-base text-ink">
                    {assistant.name}
                  </h2>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-body">
                  {assistant.systemPrompt}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  <span className="badge-pill">{assistant.model}</span>
                  <span className="badge-pill">
                    {assistant.files.length} archivo
                    {assistant.files.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3 border-t border-hairline pt-3">
                  <button
                    onClick={() => router.push(`/assistants/${assistant._id}`)}
                    className="btn-primary"
                  >
                    Chatear
                  </button>
                  <button
                    onClick={() => {
                      setCreating(false);
                      setEditing(assistant);
                    }}
                    className="btn-secondary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(assistant)}
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
