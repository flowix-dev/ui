"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";

interface PuterUsageResponse {
  usage?: {
    allowanceInfo?: {
      monthUsageAllowance?: number;
      remaining?: number;
    };
  };
}

const MICROCENTS_PER_DOLLAR = 100_000_000;

function formatDollars(microcents: number): string {
  return `$${(microcents / MICROCENTS_PER_DOLLAR).toFixed(2)}`;
}

export default function PuterUsageBadge() {
  const [state, setState] = useState<"loading" | "connected" | "disconnected">(
    "loading",
  );
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    usersApi
      .getPuterUsage()
      .then(({ data }: { data: PuterUsageResponse }) => {
        const value = data.usage?.allowanceInfo?.remaining;
        setRemaining(typeof value === "number" ? value : null);
        setState("connected");
      })
      .catch(() => {
        setState("disconnected");
      });
  }, []);

  if (state === "loading") {
    return <span className="badge-pill">Puter…</span>;
  }

  if (state === "disconnected") {
    return <span className="badge-pill">Puter no conectado</span>;
  }

  return (
    <span className="badge-pill" title="Saldo mensual restante en Puter">
      {remaining !== null
        ? `Puter: ${formatDollars(remaining)}`
        : "Puter conectado"}
    </span>
  );
}
