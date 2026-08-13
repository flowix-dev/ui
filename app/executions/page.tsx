"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchUserExecutions } from "@/store/executionSlice";

export default function ExecutionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { executions, total, loading, limit } = useAppSelector(
    (s) => s.execution,
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchUserExecutions({ page: currentPage, limit }));
  }, [dispatch, currentPage, limit]);

  const totalPages = Math.ceil(total / limit);

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
      default:
        return "bg-surface-strong text-body";
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 md:pb-8 lg:px-8">
        <h1 className="text-display text-2xl text-ink">
          Historial de ejecuciones
        </h1>
        <div className="mt-3 w-16 flow-line" aria-hidden="true" />

        {loading ? (
          <div className="py-12 text-center text-sm text-muted">Cargando…</div>
        ) : executions.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">
            No hay ejecuciones todavía.
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-hidden rounded-lg border border-hairline-strong bg-surface-card shadow-soft">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-canvas-soft">
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted">
                      Workflow
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted">
                      Inicio
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted">
                      Duración
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted">
                      Disparo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {executions.map((exec) => (
                    <tr
                      key={exec._id}
                      className="cursor-pointer hover:bg-canvas-soft"
                      onClick={() => router.push(`/executions/${exec._id}`)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-ink">
                        {typeof exec.workflowId === "object" &&
                        exec.workflowId !== null
                          ? (exec.workflowId as { name: string }).name
                          : "Workflow"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(exec.status)}`}
                        >
                          {exec.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-body">
                        {new Date(exec.startedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-body">
                        {exec.duration
                          ? `${(exec.duration / 1000).toFixed(1)}s`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-body">
                        {exec.triggerType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="btn-secondary disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-muted">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="btn-secondary disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </AuthGuard>
  );
}
