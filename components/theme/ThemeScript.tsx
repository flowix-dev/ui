"use client";

import { useEffect, useRef } from "react";

export default function ThemeScript() {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;

    try {
      const t = localStorage.getItem("flowix-theme");
      const dark =
        t === "dark" ||
        ((!t || t === "system") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    } catch {}
  }, []);

  return null;
}
