"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";

interface PuterUsageData {
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

export default function PuterUsage() {
  const [data, setData] = useState<PuterUsageData | null>(null);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    usersApi
      .getPuterUsage()
      .then(({ data }: { data: PuterUsageData }) => setData(data))
      .catch(() => setDisconnected(true));
  }, []);

  const allowance = data?.usage?.allowanceInfo;

  return (
    <div>
      <h3 className="font-semibold">Puter usage</h3>
      {disconnected ? (
        <p className="text-sm text-gray-500 mt-1">
          No conectado. Registrate conectando tu cuenta de Puter para usar IA.
        </p>
      ) : !allowance ? (
        <p className="text-sm text-gray-500 mt-1">Cargando…</p>
      ) : (
        <>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatDollars(allowance.remaining ?? 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            de {formatDollars(allowance.monthUsageAllowance ?? 0)} este mes
          </p>
        </>
      )}
    </div>
  );
}
