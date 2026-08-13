"use client";

import { ChatModel } from "@/lib/types";

interface ModelSelectorProps {
  models: ChatModel[];
  value: string;
  onChange: (modelId: string) => void;
}

export default function ModelSelector({
  models,
  value,
  onChange,
}: ModelSelectorProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-body">
      <span className="hidden sm:inline">Modelo</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={models.length === 0}
        className="rounded-lg border border-hairline-strong bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-hairline-strong focus:outline-none disabled:opacity-50 cursor-pointer"
      >
        {models.length === 0 && <option value={value}>{value}</option>}
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </label>
  );
}
