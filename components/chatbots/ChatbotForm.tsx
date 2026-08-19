"use client";

import { useState, useRef } from "react";
import { Chatbot, ChatModel } from "@/lib/types";
import { chatbotsApi, nodeDefinitionsApi } from "@/lib/api";

interface PublicTool {
  _id: string;
  fnKey: string;
  name: string;
  category: string;
}

interface ChatbotFormProps {
  initial?: Chatbot | null;
  models: ChatModel[];
  onSave: (chatbot: Chatbot) => void;
  onCancel: () => void;
}

const inputClassName =
  "w-full rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function ChatbotForm({
  initial,
  models,
  onSave,
  onCancel,
}: ChatbotFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? "");
  const [model, setModel] = useState(initial?.model ?? models[0]?.id ?? "");
  const [welcomeMessage, setWelcomeMessage] = useState(
    initial?.welcomeMessage ?? "",
  );
  const [placeholder, setPlaceholder] = useState(
    initial?.placeholder ?? "Escribí tu consulta…",
  );
  const [allowFileUpload, setAllowFileUpload] = useState(
    initial?.allowFileUpload ?? false,
  );
  const [primaryColor, setPrimaryColor] = useState(
    initial?.primaryColor ?? "#010a35",
  );
  const [position, setPosition] = useState<"bottom-left" | "bottom-right">(
    initial?.position ?? "bottom-right",
  );
  const [autoOpen, setAutoOpen] = useState(initial?.autoOpen ?? false);
  const [showPoweredBy, setShowPoweredBy] = useState(
    initial?.showPoweredBy ?? true,
  );
  const [domainsText, setDomainsText] = useState(
    (initial?.allowedDomains ?? []).join("\n"),
  );
  const [availableTools, setAvailableTools] = useState<PublicTool[]>([]);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(
    new Set((initial?.tools ?? []).map((t) => t.fnKey)),
  );
  const [toolsLoaded, setToolsLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<
    Array<{ name: string; type: string; size: number }>
  >(initial?.files ?? []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTools = () => {
    if (toolsLoaded) return;
    nodeDefinitionsApi.listPublicTools().then(({ data }) => {
      setAvailableTools(data.tools);
      setToolsLoaded(true);
    });
  };

  const toggleTool = (fnKey: string) => {
    setSelectedTools((prev) => {
      const next = new Set(prev);
      if (next.has(fnKey)) {
        next.delete(fnKey);
      } else {
        next.add(fnKey);
      }
      return next;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !initial) return;
    setUploading(true);
    try {
      const { data } = await chatbotsApi.uploadFile(initial._id, file);
      setFiles(data.chatbot.files);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al subir archivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileDelete = async (fileName: string) => {
    if (!initial) return;
    try {
      const { data } = await chatbotsApi.deleteFile(initial._id, fileName);
      setFiles(data.chatbot.files);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Error al eliminar archivo",
      );
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name,
        systemPrompt,
        model,
        welcomeMessage: welcomeMessage || undefined,
        placeholder: placeholder || undefined,
        allowFileUpload,
        primaryColor,
        position,
        autoOpen,
        showPoweredBy,
        allowedDomains: domainsText
          .split("\n")
          .map((d) => d.trim())
          .filter(Boolean),
        tools: availableTools
          .filter((tool) => selectedTools.has(tool.fnKey))
          .map((tool) => ({ fnKey: tool.fnKey, name: tool.name })),
      };

      if (initial) {
        const { data } = await chatbotsApi.update(initial._id, payload);
        onSave(data.chatbot);
      } else {
        const { data } = await chatbotsApi.create(payload);
        onSave(data.chatbot);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el chatbot",
      );
    } finally {
      setBusy(false);
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
            placeholder="Ej. Asistente de ventas"
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
            placeholder="Ej. Sos el asistente de ventas de mi tienda. Respondé con tono cercano y ayudá a resolver dudas."
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
            Mensaje de bienvenida
          </label>
          <input
            type="text"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Ej. ¡Hola! ¿En qué puedo ayudarte?"
            className={inputClassName}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Placeholder del input
          </label>
          <input
            type="text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Tools disponibles (solo tools seguras)
          </label>
          {toolsLoaded ? (
            availableTools.length > 0 ? (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {availableTools.map((tool) => (
                  <label
                    key={tool.fnKey}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-hairline bg-canvas-soft px-3 py-1.5 text-sm text-body transition hover:border-primary/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTools.has(tool.fnKey)}
                      onChange={() => toggleTool(tool.fnKey)}
                      className="accent-primary"
                    />
                    <span className="truncate">{tool.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">
                No hay tools seguras disponibles.
              </p>
            )
          ) : (
            <button type="button" onClick={loadTools} className="btn-secondary">
              Cargar tools disponibles
            </button>
          )}
          <p className="mt-2 text-xs text-muted">
            Solo se muestran tools seguras que no usan tus credenciales ni
            acceden a datos internos.
          </p>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-md border border-hairline bg-canvas-soft px-3 py-2.5">
          <span className="text-sm text-body">
            Permitir subir archivos en la conversación
          </span>
          <input
            type="checkbox"
            checked={allowFileUpload}
            onChange={(e) => setAllowFileUpload(e.target.checked)}
            className="accent-primary"
          />
        </label>

        {initial && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Archivos de conocimiento
            </label>
            <p className="mb-2 text-xs text-muted">
              Subí archivos que el chatbot usará como referencia para responder.
            </p>
            {files.length > 0 && (
              <div className="mb-2 space-y-1">
                {files.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center justify-between rounded-md border border-hairline bg-canvas-soft px-3 py-1.5 text-sm"
                  >
                    <span className="truncate text-body">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => handleFileDelete(f.name)}
                      className="ml-2 shrink-0 text-semantic-error hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-sm"
            >
              {uploading ? "Subiendo…" : "Subir archivo"}
            </button>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Dominios permitidos (uno por línea)
          </label>
          <textarea
            value={domainsText}
            onChange={(e) => setDomainsText(e.target.value)}
            placeholder="https://mipagina.com&#10;https://app.mipagina.com"
            rows={2}
            className={`${inputClassName} resize-y font-mono text-xs`}
          />
          <p className="mt-1 text-xs text-muted">
            Si se deja vacío, el chatbot se puede incrustar en cualquier
            dominio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Color principal
            </label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-full cursor-pointer rounded-md border border-hairline-strong bg-canvas-soft"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Posición del widget
            </label>
            <select
              value={position}
              onChange={(e) =>
                setPosition(e.target.value as "bottom-left" | "bottom-right")
              }
              className={inputClassName}
            >
              <option value="bottom-right">Abajo a la derecha</option>
              <option value="bottom-left">Abajo a la izquierda</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={autoOpen}
              onChange={(e) => setAutoOpen(e.target.checked)}
              className="accent-primary"
            />
            Abrir automáticamente
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={showPoweredBy}
              onChange={(e) => setShowPoweredBy(e.target.checked)}
              className="accent-primary"
            />
            Mostrar &quot;Powered by Flowix&quot;
          </label>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button onClick={handleSave} disabled={busy} className="btn-primary">
          {busy ? "Guardando…" : initial ? "Guardar cambios" : "Crear chatbot"}
        </button>
        <button onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </div>
  );
}
