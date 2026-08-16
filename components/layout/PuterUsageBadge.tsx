"use client";

const PUTER_USAGE_URL = "https://puter.com/dashboard#usage";

export default function PuterUsageBadge() {
  return (
    <a
      href={PUTER_USAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="badge-pill transition hover:bg-surface-strong"
      title="Ver uso en Puter"
    >
      Puter
    </a>
  );
}
