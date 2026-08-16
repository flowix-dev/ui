"use client";

const PUTER_USAGE_URL = "https://puter.com/dashboard#usage";

export default function PuterUsage() {
  return (
    <div>
      <h3 className="font-semibold">Credits</h3>
      <p className="mt-1 text-sm text-body">
        Tu saldo y consumo se ven en tu cuenta de Puter.
      </p>
      <a
        href={PUTER_USAGE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary mt-3"
      >
        Ver en Puter
      </a>
    </div>
  );
}
