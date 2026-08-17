"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme/ThemeToggle";

const links = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    href: "/workflows",
    label: "Workflows",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M10 6.5h4a2 2 0 0 1 2 2v3.5" />
        <path d="M14 17.5h-4" />
      </svg>
    ),
  },
  {
    href: "/assistants",
    label: "Asistentes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M15 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
        <path d="M5 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
        <path d="M5 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
        <path d="M9 7h10" />
        <path d="M9 19h10" />
        <path d="M9 13h10" />
      </svg>
    ),
  },
  {
    href: "/chat",
    label: "Chat",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    ),
  },
  {
    href: "/executions",
    label: "Ejecuciones",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline-strong bg-canvas md:hidden">
        <div className="mx-auto flex h-14 max-w-lg items-stretch">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium transition ${
                isActive(link.href) ? "text-ink" : "text-muted"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="fixed bottom-[4.5rem] right-4 z-30 md:hidden">
        <ThemeToggle />
      </div>
    </>
  );
}
