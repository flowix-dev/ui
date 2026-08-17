"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { login, clearError } from "@/store/authSlice";
import { FlowixLogo } from "@/components/marketing/icons";
import ThemeToggle from "@/components/theme/ThemeToggle";

const inputClassName =
  "h-11 w-full rounded-md border border-hairline-strong bg-surface-card px-4 text-sm text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-on-primary">
            <FlowixLogo />
          </span>
          <span className="text-display text-base font-semibold text-ink">
            Flowix
          </span>
        </Link>

        <div className="rounded-lg border border-hairline-strong bg-surface-card p-8">
          <h1 className="text-display text-[1.5rem] text-ink">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-body">
            Accede a tu cuenta para seguir automatizando.
          </p>

          {error && (
            <div className="mt-4 flex items-start justify-between gap-2 rounded-md border border-semantic-error bg-canvas-soft p-3 text-sm text-ink">
              <span>{error}</span>
              <button
                onClick={() => dispatch(clearError())}
                className="font-semibold text-muted hover:text-ink cursor-pointer"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClassName}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClassName}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-body">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-link hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
