"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import PuterUsage from "@/components/layout/PuterUsage";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchUserExecutions } from "@/store/executionSlice";

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { executions, total, loading } = useAppSelector((s) => s.execution);

  useEffect(() => {
    dispatch(fetchUserExecutions({ page: 1, limit: 5 }));
  }, [dispatch]);

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
        <div className="mb-8">
          <h1 className="text-display text-2xl text-ink">
            Buenas, {user?.firstName}.
          </h1>
          <div className="mt-3 w-16 flow-line" aria-hidden="true" />
          <p className="mt-3 text-sm text-body">
            {total} ejecucion{total !== 1 ? "es" : ""} en total. Elegí dónde
            seguir.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            onClick={() => router.push("/workflows")}
            className="rounded-lg border border-hairline-strong bg-surface-card p-5 text-left shadow-soft transition hover:border-primary/40 cursor-pointer"
          >
            <h3 className="text-display text-base text-ink">
              Correr un workflow
            </h3>
            <p className="mt-1 text-sm text-body">
              Elegí y ejecutá una automatización.
            </p>
          </button>
          <button
            onClick={() => router.push("/executions")}
            className="rounded-lg border border-hairline-strong bg-surface-card p-5 text-left shadow-soft transition hover:border-primary/40 cursor-pointer"
          >
            <h3 className="text-display text-base text-ink">Ver historial</h3>
            <p className="mt-1 text-sm text-body">
              Repasá todas tus ejecuciones pasadas.
            </p>
          </button>
          <div className="rounded-lg border border-hairline-strong bg-surface-card p-5 shadow-soft">
            <PuterUsage />
          </div>
        </div>

        <div className="rounded-lg border border-hairline-strong bg-surface-card shadow-soft">
          <div className="border-b border-hairline px-6 py-4">
            <h2 className="text-display text-base text-ink">
              Ejecuciones recientes
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-muted">Cargando…</div>
          ) : executions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">
              Todavía no hay ejecuciones. Corré un workflow para empezar.
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {executions.map((exec) => (
                <div
                  key={exec._id}
                  className="flex cursor-pointer items-center justify-between px-6 py-4 hover:bg-canvas-soft"
                  onClick={() => router.push(`/executions/${exec._id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {typeof exec.workflowId === "object" &&
                      exec.workflowId !== null
                        ? (exec.workflowId as { name: string }).name
                        : "Workflow"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(exec.startedAt).toLocaleString()}
                      {exec.duration
                        ? ` · ${(exec.duration / 1000).toFixed(1)}s`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(exec.status)}`}
                  >
                    {exec.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {executions.length > 0 && (
            <div className="border-t border-hairline px-6 py-3 text-center">
              <button
                onClick={() => router.push("/executions")}
                className="text-sm text-link hover:underline cursor-pointer"
              >
                Ver todas las ejecuciones →
              </button>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
