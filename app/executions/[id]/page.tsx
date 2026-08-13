"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchExecution } from "@/store/executionSlice";

export default function ExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    currentExecution: exec,
    loading,
    error,
  } = useAppSelector((s) => s.execution);

  useEffect(() => {
    if (params.id) {
      dispatch(fetchExecution(params.id as string));
    }
  }, [dispatch, params.id]);

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-semantic-success/10 text-semantic-success";
      case "failed":
        return "bg-semantic-error/10 text-semantic-error";
      case "running":
        return "bg-accent-warning/10 text-accent-warning";
      case "pending":
        return "bg-surface-strong text-body";
      case "cancelled":
        return "bg-surface-strong text-body";
      case "skipped":
        return "bg-surface-strong text-muted";
      default:
        return "bg-surface-strong text-body";
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 text-center text-muted">
          Cargando…
        </main>
      </AuthGuard>
    );
  }

  if (error || !exec) {
    return (
      <AuthGuard>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-lg border border-semantic-error/40 bg-semantic-error/10 p-6 text-semantic-error">
            {error || "Ejecución no encontrada"}
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 md:pb-8 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-block cursor-pointer text-sm text-link hover:underline"
        >
          ← Volver
        </button>

        <div className="mb-6 rounded-lg border border-hairline-strong bg-surface-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-display text-2xl text-ink">
              {exec.workflowSnapshot?.name || "Ejecución"}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColor(exec.status)}`}
            >
              {exec.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="text-muted">Inicio</span>
              <p className="font-medium text-ink">
                {new Date(exec.startedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted">Duración</span>
              <p className="font-medium text-ink">
                {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : "-"}
              </p>
            </div>
            <div>
              <span className="text-muted">Disparo</span>
              <p className="font-medium capitalize text-ink">
                {exec.triggerType}
              </p>
            </div>
            <div>
              <span className="text-muted">Nodos</span>
              <p className="font-medium text-ink">
                {exec.nodeExecutions.length} /{" "}
                {exec.workflowSnapshot?.nodes?.length || 0}
              </p>
            </div>
          </div>

          {exec.error && (
            <div className="mt-4 rounded-md border border-semantic-error/40 bg-semantic-error/10 p-3 text-sm text-semantic-error">
              {exec.error}
            </div>
          )}
        </div>

        <h2 className="text-display mb-4 text-base text-ink">
          Ejecución de nodos
        </h2>
        <div className="space-y-3">
          {exec.nodeExecutions.map((nodeExec) => (
            <div
              key={nodeExec.nodeId}
              className="rounded-lg border border-hairline-strong bg-surface-card p-4 shadow-soft"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">
                    {nodeExec.nodeName || `Node ${nodeExec.nodeId}`}
                  </span>
                  <span className="text-xs text-muted">
                    ID: {nodeExec.nodeId}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(nodeExec.status)}`}
                >
                  {nodeExec.status}
                </span>
              </div>

              <div className="mb-2 grid grid-cols-2 gap-4 text-sm text-body">
                {nodeExec.startedAt && (
                  <div>
                    <span className="text-muted">Inicio:</span>{" "}
                    {new Date(nodeExec.startedAt).toLocaleTimeString()}
                  </div>
                )}
                {nodeExec.duration !== undefined && (
                  <div>
                    <span className="text-muted">Duración:</span>{" "}
                    {(nodeExec.duration / 1000).toFixed(2)}s
                  </div>
                )}
              </div>

              {nodeExec.error && (
                <div className="mb-2 rounded border border-semantic-error/40 bg-semantic-error/10 p-2 text-xs text-semantic-error">
                  {nodeExec.error}
                </div>
              )}

              {(!!nodeExec.inputData || !!nodeExec.outputData) && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-link hover:underline">
                    Ver datos
                  </summary>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {!!nodeExec.inputData && (
                      <div>
                        <p className="mb-1 font-medium text-muted">Entrada:</p>
                        <pre className="max-h-40 overflow-auto rounded bg-canvas-soft p-2 text-body">
                          {
                            JSON.stringify(
                              nodeExec.inputData,
                              null,
                              2,
                            ) as React.ReactNode
                          }
                        </pre>
                      </div>
                    )}
                    {!!nodeExec.outputData && (
                      <div>
                        <p className="mb-1 font-medium text-muted">Salida:</p>
                        <pre className="max-h-40 overflow-auto rounded bg-canvas-soft p-2 text-body">
                          {
                            JSON.stringify(
                              nodeExec.outputData,
                              null,
                              2,
                            ) as React.ReactNode
                          }
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </main>
    </AuthGuard>
  );
}
