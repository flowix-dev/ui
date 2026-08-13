"use client";

import { useState } from "react";
import { Assistant, AssistantFile, ChatModel } from "@/lib/types";
import { assistantsApi } from "@/lib/api";

interface AssistantFormProps {
  initial?: Assistant | null;
  models: ChatModel[];
  onSave: (assistant: Assistant) => void;
  onCancel: () => void;
}

const inputClassName =
  "w-full rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AssistantForm({
  initial,
  models,
  onSave,
  onCancel,
}: AssistantFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? "");
  const [model, setModel] = useState(initial?.model ?? models[0]?.id ?? "");
  const [files, setFiles] = useState<AssistantFile[]>(initial?.files ?? []);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      return;
    }
    setBusy(true);
    try {
      if (initial) {
        const { data } = await assistantsApi.update(initial._id, {
          name,
          systemPrompt,
          model,
        });
        onSave(data.assistant);
      } else {
        const { data } = await assistantsApi.create({
          name,
          systemPrompt,
          model,
        });
        onSave(data.assistant);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el asistente",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (selected: FileList | null) => {
    if (!selected?.[0] || !initial) {
      return;
    }
    setUploading(true);
    try {
      const { data } = await assistantsApi.uploadFile(initial._id, selected[0]);
      setFiles(data.assistant.files);
    } catch {
      alert("No se pudo subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async (fileName: string) => {
    if (!initial) {
      return;
    }
    try {
      const { data } = await assistantsApi.deleteFile(initial._id, fileName);
      setFiles(data.assistant.files);
    } catch {
      alert("No se pudo eliminar el archivo");
    }
  };

  return (
    <div className="rounded-lg border border-hairline-strong bg-surface-card p-5 shadow-soft">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Soporte en español"
            className={inputClassName}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Prompt inicial
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Ej. Sos un asistente de soporte que responde con tono cercano y claro."
            rows={4}
            className={`${inputClassName} resize-y`}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Modelo
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={inputClassName}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Archivos de conocimiento
          </label>
          {initial ? (
            <div className="space-y-2">
              {files.length > 0 && (
                <ul className="space-y-1">
                  {files.map((file) => (
                    <li
                      key={file.name}
                      className="flex items-center justify-between rounded-md border border-hairline bg-canvas-soft px-3 py-1.5 text-sm text-body"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.name)}
                        className="ml-2 shrink-0 text-xs text-semantic-error hover:underline cursor-pointer"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-hairline-strong bg-canvas-soft px-3 py-2.5 text-sm text-body transition hover:border-primary/50 hover:bg-surface-strong">
                {uploading ? "Subiendo…" : "+ Subir archivo"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files)}
                />
              </label>
              <p className="text-xs text-muted">
                Texto, CSV, PDF, Office e imágenes. Se indexan automáticamente
                para que el asistente los use.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted">
              Guardá el asistente para poder subirle archivos.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button onClick={handleSave} disabled={busy} className="btn-primary">
          {busy
            ? "Guardando…"
            : initial
              ? "Guardar cambios"
              : "Crear asistente"}
        </button>
        <button onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </div>
  );
}
