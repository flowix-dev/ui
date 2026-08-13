import { usersApi } from "@/lib/api";

interface PuterWindow extends Window {
  puter?: {
    auth: {
      signIn: (options?: Record<string, unknown>) => Promise<{
        success?: boolean;
        token?: string;
        username?: string;
        error?: string;
        msg?: string;
      }>;
      isSignedIn: () => Promise<boolean>;
      signOut: () => Promise<void>;
    };
  };
}

const PUTER_SCRIPT = "https://js.puter.com/v2/";

function loadPuterScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as PuterWindow).puter) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PUTER_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Puter")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = PUTER_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Puter"));
    document.head.appendChild(script);
  });
}

export async function connectPuter(): Promise<void> {
  await loadPuterScript();
  const puter = (window as PuterWindow).puter;
  if (!puter) {
    throw new Error("Puter no está disponible");
  }
  const result = await puter.auth.signIn({
    attempt_temp_user_creation: true,
  });
  if (!result?.token) {
    throw new Error(
      result?.msg ?? result?.error ?? "No se pudo conectar con Puter",
    );
  }
  await usersApi.savePuterToken(result.token);
  localStorage.setItem("puter-connected", result.username ?? "true");
}

export async function isPuterConnected(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }
  if (localStorage.getItem("puter-connected")) {
    return true;
  }
  try {
    await loadPuterScript();
    const puter = (window as PuterWindow).puter;
    return puter ? await puter.auth.isSignedIn() : false;
  } catch {
    return false;
  }
}

export function getPuterUsername(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("puter-connected");
}

export function clearPuterConnection(): void {
  localStorage.removeItem("puter-connected");
}
