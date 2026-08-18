"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "flowix-theme";

function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolve(theme: ThemePreference): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: "light" | "dark"): void {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    const resolved = resolve(stored);
    setThemeState(stored);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      applyTheme(resolvedTheme);
    }
  }, [resolvedTheme, mounted]);

  useEffect(() => {
    if (!mounted || theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      setResolvedTheme(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme, mounted]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    setResolvedTheme(resolve(next));
  }, []);

  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{ theme: "system", resolvedTheme: "light", setTheme: () => {} }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
