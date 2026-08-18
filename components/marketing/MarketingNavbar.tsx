"use client";

import { useState } from "react";
import Link from "next/link";
import { FlowixLogo } from "./icons";
import ThemeToggle from "@/components/theme/ThemeToggle";

const NAV_LINKS = [
  { label: "Workflows", href: "#workflows" },
  { label: "Asistentes", href: "#asistentes" },
  { label: "Chatbots", href: "#chatbots" },
  { label: "Modelos", href: "#modelos" },
];

export default function MarketingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary dark:bg-[#010a35] text-on-primary">
            <FlowixLogo />
          </span>
          <span className="text-display text-base font-semibold text-ink">
            Flowix
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-body transition hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-ink transition hover:text-link"
          >
            Iniciar sesión
          </Link>
          <Link href="/register" className="btn-primary">
            Empezar gratis
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-ink md:hidden"
          aria-label="Abrir menú"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-hairline bg-canvas px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 border-t border-hairline pt-4">
              <ThemeToggle />
              <Link href="/login" className="text-sm font-medium text-ink">
                Iniciar sesión
              </Link>
              <Link href="/register" className="btn-primary justify-center">
                Empezar gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
