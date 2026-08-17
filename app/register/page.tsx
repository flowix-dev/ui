"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { register, clearError } from "@/store/authSlice";
import { connectPuter } from "@/lib/puter";
import { FlowixLogo } from "@/components/marketing/icons";
import ThemeToggle from "@/components/theme/ThemeToggle";

const inputClassName =
  "h-11 w-full rounded-md border border-hairline-strong bg-surface-card px-4 text-sm text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registered, setRegistered] = useState(false);
  const [connectingPuter, setConnectingPuter] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(
      register({ firstName, lastName, email, password }),
    );
    if (register.fulfilled.match(result)) {
      setRegistered(true);
    }
  };

  const handleConnectPuter = async () => {
    setConnectingPuter(true);
    try {
      await connectPuter();
      router.push("/dashboard");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo conectar con Puter",
      );
    } finally {
      setConnectingPuter(false);
    }
  };

  const skipPuter = () => {
    router.push("/dashboard");
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
          {registered ? (
            <div className="text-center">
              <h1 className="text-display text-[1.5rem] text-ink">
                Cuenta creada
              </h1>
              <p className="mt-1 text-sm text-body">
                Conectá tu cuenta de Puter para usar los modelos de IA. Cada
                usuario cubre su propio consumo.
              </p>

              <button
                type="button"
                onClick={handleConnectPuter}
                disabled={connectingPuter}
                className="btn-primary mt-6 w-full disabled:opacity-50"
              >
                {connectingPuter
                  ? "Conectando…"
                  : "Crear / conectar cuenta de Puter"}
              </button>

              <button
                type="button"
                onClick={skipPuter}
                className="mt-3 w-full text-sm text-muted hover:text-ink cursor-pointer"
              >
                Omitir por ahora
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-display text-[1.5rem] text-ink">
                Crear cuenta
              </h1>
              <p className="mt-1 text-sm text-body">
                Empieza a automatizar en menos de un minuto.
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
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>

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
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClassName}
                    placeholder="Al menos 8 caracteres"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? "Creando cuenta…" : "Crear cuenta"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-body">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-link hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
