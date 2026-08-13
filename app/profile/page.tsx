"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { usersApi } from "@/lib/api";
import { connectPuter, getPuterUsername, isPuterConnected } from "@/lib/puter";

const MICROCENTS_PER_DOLLAR = 100_000_000;
const PUTER_BILLING_URL = "https://puter.com/dashboard#billing";
const PUTER_USAGE_URL = "https://puter.com/dashboard#usage";

function formatDollars(microcents: number): string {
  return `$${(microcents / MICROCENTS_PER_DOLLAR).toFixed(2)}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    remaining?: number;
    allowance?: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    isPuterConnected().then((ok) => {
      setConnected(ok);
      setUsername(getPuterUsername());
    });
    usersApi
      .getPuterUsage()
      .then(({ data }) => {
        setUsage({
          remaining: data.usage?.allowanceInfo?.remaining,
          allowance: data.usage?.allowanceInfo?.monthUsageAllowance,
        });
      })
      .catch(() => {
        setUsage(null);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await connectPuter();
      setConnected(true);
      setUsername(getPuterUsername());
      load();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo conectar con Puter",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6 md:pb-8">
        <h1 className="text-display text-2xl text-ink">Perfil</h1>
        <div className="mt-3 w-16 flow-line" aria-hidden="true" />

        <div className="mt-6 rounded-lg border border-hairline-strong bg-surface-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-display text-base text-ink">Puter</h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                connected
                  ? "bg-semantic-success/10 text-semantic-success"
                  : "bg-surface-strong text-muted"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected ? "bg-semantic-success" : "bg-muted"
                }`}
              />
              {connected ? "Conectado" : "No conectado"}
            </span>
          </div>

          <p className="mt-1 text-sm text-body">
            Los modelos de IA se pagan con tu cuenta de Puter (cada usuario
            cubre su propio consumo).
          </p>

          {connected ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-hairline bg-canvas-soft p-4">
                <p className="text-xs text-muted">Usuario</p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {username ?? "Puter"}
                </p>
              </div>
              <div className="rounded-md border border-hairline bg-canvas-soft p-4">
                <p className="text-xs text-muted">Saldo restante</p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {usage?.remaining != null
                    ? formatDollars(usage.remaining)
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-hairline bg-canvas-soft p-4">
                <p className="text-xs text-muted">Cuota mensual</p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {usage?.allowance != null
                    ? formatDollars(usage.allowance)
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-body">
              Conectá tu cuenta de Puter para poder usar los asistentes y el
              chat con modelos.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {connected ? (
              <>
                <a
                  href={PUTER_BILLING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Recargar créditos
                </a>
                <a
                  href={PUTER_USAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Ver consumo
                </a>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={busy}
                className="btn-primary"
              >
                {busy ? "Conectando…" : "Conectar Puter"}
              </button>
            )}
            <button
              onClick={() => router.push("/chat")}
              className="btn-secondary"
            >
              Ir al chat
            </button>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
