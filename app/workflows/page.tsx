"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchWorkflows,
  createWorkflow,
  deleteWorkflow,
} from "@/store/workflowSlice";

export default function WorkflowsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { workflows, loading } = useAppSelector((s) => s.workflow);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    dispatch(fetchWorkflows());
  }, [dispatch]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const result = await dispatch(createWorkflow(newName.trim()));
    if (createWorkflow.fulfilled.match(result)) {
      setShowCreate(false);
      setNewName("");
      router.push(`/workflows/${result.payload._id}`);
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 md:pb-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-display text-2xl text-ink">Workflows</h1>
            <div className="mt-3 w-16 flow-line" aria-hidden="true" />
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + Nuevo workflow
          </button>
        </div>

        {showCreate && (
          <div className="mb-6 flex gap-3 rounded-lg border border-hairline-strong bg-surface-card p-4 shadow-soft">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nombre del workflow…"
              className="flex-1 rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <button onClick={handleCreate} className="btn-primary">
              Crear
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setNewName("");
              }}
              className="px-4 py-2 text-sm text-muted hover:text-ink cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-muted">Cargando…</div>
        ) : workflows.length === 0 ? (
          <div className="rounded-lg border border-hairline-strong bg-surface-card py-12 text-center shadow-soft">
            <p className="mb-4 text-sm text-body">Todavía no hay workflows</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Crear tu primer workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => (
              <div
                key={wf._id}
                className="cursor-pointer rounded-lg border border-hairline-strong bg-surface-card p-5 shadow-soft transition hover:border-primary/40"
                onClick={() => router.push(`/workflows/${wf._id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-display text-base text-ink">
                      {wf.name}
                    </h3>
                    <p className="mt-1 text-sm text-body">
                      {wf.nodes.length} nodo{wf.nodes.length !== 1 ? "s" : ""} ·{" "}
                      {wf.edges.length} conexión
                      {wf.edges.length !== 1 ? "es" : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Actualizado el{" "}
                      {new Date(wf.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-3">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/workflows/${wf._id}`);
                    }}
                    className="text-xs text-link hover:underline cursor-pointer"
                  >
                    Abrir
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("¿Eliminar este workflow?"))
                        dispatch(deleteWorkflow(wf._id));
                    }}
                    className="text-xs text-semantic-error hover:underline cursor-pointer"
                  >
                    Eliminar
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
