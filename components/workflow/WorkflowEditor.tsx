"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type NodeProps,
  addEdge,
  MarkerType,
  Handle,
  Position,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { useRouter } from "next/navigation";
import { WorkflowNode, WorkflowEdge } from "@/lib/types";
import api, {
  nodeDefinitionsApi,
  workflowCrudApi,
  workflowApi,
  assistantsApi,
} from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchExecution,
  setExecutionRunning,
  updateExecutionStatus,
} from "@/store/executionSlice";
import ExecutionSidebar from "./ExecutionSidebar";
import WorkflowChat from "./WorkflowChat";

interface WorkflowEditorProps {
  workflowId: string;
  initialNodes: WorkflowNode[];
  initialEdges: WorkflowEdge[];
  parentWorkflowId?: string;
  onRegisterSave?: (save: () => void) => void;
  onSave: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onRun: (
    file: File | undefined,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
  ) => void;
  saving: boolean;
}

type SelectOption = string | { value: string; label: string };

type PortDef = {
  key: string;
  type: string;
  input?: string;
  options?: SelectOption[];
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
};

type NodeDef = {
  _id: string;
  fnKey: string;
  name: string;
  category: string;
  inputs: PortDef[];
  outputs: PortDef[];
  config: Record<string, unknown>;
};

const TYPE_LABELS: Record<string, string> = {
  string: "text",
  number: "number",
  boolean: "boolean",
  object: "object",
  "number[]": "number[]",
  "any[]": "any[]",
  json: "json",
  image: "image",
  file: "file",
  audio: "audio",
  credentials: "credentials",
  any: "any",
};

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="rounded bg-surface-strong px-1 font-mono text-[9px] uppercase tracking-wide text-muted">
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function isArrayType(type: string): boolean {
  return type === "number[]" || type === "any[]";
}

function isTypeCompatible(
  sourceType: string | undefined,
  targetType: string | undefined,
): boolean {
  if (!sourceType || !targetType) {
    return false;
  }
  if (sourceType === "any" || targetType === "any") {
    return true;
  }
  if (sourceType === targetType) {
    return true;
  }
  if (sourceType === "number" && targetType === "string") {
    return true;
  }
  if (
    sourceType === "json" &&
    (targetType === "object" || isArrayType(targetType))
  ) {
    return true;
  }
  if (
    (sourceType === "object" || isArrayType(sourceType)) &&
    targetType === "json"
  ) {
    return true;
  }
  if (isArrayType(sourceType)) {
    return targetType !== "file" && targetType !== "credentials";
  }
  if (isArrayType(targetType)) {
    return sourceType === "string";
  }
  return false;
}

function parseCaseList(text: string): string[] {
  const values: string[] = [];
  let current = "";
  let quote: string | null = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ",") {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);

  return values.map((item) => item.trim()).filter((item) => item !== "");
}

function parseSwitchCases(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== "string") {
    return [];
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      /* fall through to CSV parsing */
    }
  }
  return parseCaseList(trimmed);
}

function CredentialsButton({
  provider,
  value,
  onChange,
}: {
  provider: string;
  value?: unknown;
  onChange?: (v: string) => void;
}) {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    api
      .get(`/credentials/${provider}`)
      .then(({ data }) => {
        setConnected(!!data.connected);
        setEmail(data.email ?? null);
        if (data.connected && !value && onChange) onChange(provider);
      })
      .catch(() => setConnected(false));
  }, [provider, value, onChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (connected && !value && onChange) onChange(provider);
  }, [connected, value, onChange, provider]);

  const handleClick = async () => {
    setBusy(true);
    try {
      const { data } = await api.get(`/credentials/${provider}/auth`);
      const popup = window.open(data.url, "_blank", "width=620,height=720");
      if (!popup) {
        alert("Permití las ventanas emergentes para conectar.");
        return;
      }
      const timer = setInterval(async () => {
        try {
          const { data: status } = await api.get(`/credentials/${provider}`);
          if (status.connected) {
            clearInterval(timer);
            setConnected(true);
            setEmail(status.email ?? null);
            setBusy(false);
            if (onChange) onChange(provider);
          }
        } catch {
          /* keep polling */
        }
      }, 2000);
      const closeCheck = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          clearInterval(closeCheck);
          setBusy(false);
          refresh();
        }
      }, 1000);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo conectar");
      setBusy(false);
    }
  };

  if (connected) {
    return (
      <span
        className="block truncate rounded-md border border-hairline-strong bg-canvas-soft px-2 py-1 text-xs font-medium text-ink"
        title={email ?? "Conectado"}
      >
        ✓ {email ?? "Conectado"}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="w-full cursor-pointer rounded-md border border-dashed border-hairline-strong bg-canvas-soft px-2 py-1 text-xs font-medium text-body transition hover:border-primary/50 hover:bg-surface-strong"
    >
      {busy ? "Conectando…" : `Conectar ${provider}`}
    </button>
  );
}

function renderWidget(
  port: PortDef,
  value: unknown,
  onChange: (value: unknown) => void,
) {
  const stringValue = (value as string) ?? "";
  if (port.input === "textarea") {
    return (
      <textarea
        rows={2}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded border border-hairline px-1 py-0.5 text-xs text-ink"
      />
    );
  }
  if (port.input === "select") {
    return (
      <select
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-hairline bg-surface-card px-1 py-0.5 text-xs text-ink"
      >
        {(port.options ?? []).map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    );
  }
  if (port.input === "none") {
    return <span className="text-[10px] text-muted">—</span>;
  }
  if (
    port.input === "number" ||
    (port.input == null && port.type === "number")
  ) {
    return (
      <input
        type="number"
        value={(value as string | number) ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? "" : Number(val));
        }}
        className="w-full rounded border border-hairline px-1 py-0.5 text-xs text-ink"
      />
    );
  }
  return (
    <input
      type="text"
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-hairline px-1 py-0.5 text-xs text-ink"
    />
  );
}

function WorkflowNodeComponent({ data, selected }: NodeProps) {
  const label = data.label as string;
  const nodeDef = data.nodeDef as NodeDef | undefined;
  const fnKey = data.fnKey as string;
  const inputValues = (data.inputValues as Record<string, unknown>) || {};
  const modelOptions = useMemo(
    () => (data.modelOptions as SelectOption[]) || [],
    [data.modelOptions],
  );
  const assistantOptions = useMemo(
    () => (data.assistantOptions as SelectOption[]) || [],
    [data.assistantOptions],
  );
  const connectedInputs =
    (data.connectedInputs as Record<string, boolean>) || {};
  const uploadedFileName = data.uploadedFileName as string | null | undefined;
  const onNodeFileSelect = data.onNodeFileSelect as
    ((file: File | null) => void) | undefined;
  const onInputChange = data.onInputChange as (
    key: string,
    value: unknown,
  ) => void;

  const inputPorts = useMemo(() => nodeDef?.inputs || [], [nodeDef]);
  const visibleInputPorts = useMemo(() => {
    const keysByNode: Record<string, Record<string, string[]>> = {
      "array.operations": {
        push: ["array", "value"],
        join: ["array", "separator"],
        filter: ["array", "expression"],
        map: ["array", "expression"],
        concat: ["array", "value"],
        slice: ["array", "start", "end"],
      },
      "text.operations": {
        split: ["text", "separator"],
        replace: ["text", "search", "replacement"],
        slice: ["text", "start", "end"],
        upper: ["text"],
        lower: ["text"],
        trim: ["text"],
      },
      "object.operations": {
        merge: ["object1", "object2"],
        set: ["object", "key", "value"],
      },
      "google.docs": {
        create: ["credentials", "title", "content"],
        list: ["credentials"],
        read: ["credentials", "documentId"],
        update: ["credentials", "documentId", "find", "replacement"],
      },
      "google.sheets": {
        append: ["credentials", "spreadsheetId", "sheetName", "values"],
        read: ["credentials", "spreadsheetId", "sheetName", "range"],
        list: ["credentials"],
        update: [
          "credentials",
          "spreadsheetId",
          "sheetName",
          "range",
          "values",
        ],
      },
      "google.slides": {
        create: ["credentials", "title"],
        list: ["credentials"],
        read: ["credentials", "presentationId"],
        update: ["credentials", "presentationId", "title"],
      },
    };
    const keysByOperation = keysByNode[fnKey];
    if (!keysByOperation) {
      return inputPorts;
    }
    const keys =
      keysByOperation[String(inputValues.operation ?? "")] ??
      inputPorts.map((port) => port.key);
    return inputPorts.filter(
      (port) =>
        keys.includes(port.key) ||
        port.key === "operation" ||
        port.key === "mode",
    );
  }, [fnKey, inputPorts, inputValues.operation]);
  const switchCases = useMemo(() => {
    if (fnKey !== "switch") return [];
    return parseSwitchCases(inputValues.cases);
  }, [fnKey, inputValues.cases]);
  const outputPorts = useMemo(() => {
    if (fnKey === "switch") {
      return [
        ...switchCases.map((_, i) => ({ key: `case${i + 1}`, type: "any" })),
        { key: "default", type: "any" },
      ];
    }
    return nodeDef?.outputs || [];
  }, [nodeDef, fnKey, switchCases]);
  const toCount = (raw: unknown, fallback: number) => {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
  };
  const dynamicPorts = useMemo(() => {
    const makePort = (key: string): PortDef => ({
      key,
      type: "any",
      input: "none",
    });
    if (fnKey === "run.workflow") {
      const inputCount = toCount(inputValues.inputCount, 1);
      const outputCount = toCount(inputValues.outputCount, 1);
      return {
        inputs: Array.from({ length: inputCount }, (_, i) =>
          makePort(`input${i + 1}`),
        ),
        outputs: Array.from({ length: outputCount }, (_, i) =>
          makePort(`output${i + 1}`),
        ),
      };
    }
    if (fnKey === "get.inputs") {
      const count = toCount(inputValues.count, 1);
      return {
        inputs: [],
        outputs: Array.from({ length: count }, (_, i) =>
          makePort(`input${i + 1}`),
        ),
      };
    }
    if (fnKey === "send.outputs") {
      const count = toCount(inputValues.count, 1);
      return {
        inputs: Array.from({ length: count }, (_, i) =>
          makePort(`output${i + 1}`),
        ),
        outputs: [],
      };
    }
    return { inputs: [] as PortDef[], outputs: [] as PortDef[] };
  }, [
    fnKey,
    inputValues.inputCount,
    inputValues.outputCount,
    inputValues.count,
  ]);
  const allInputPorts = useMemo(
    () => [...visibleInputPorts, ...dynamicPorts.inputs],
    [visibleInputPorts, dynamicPorts.inputs],
  );
  const allOutputPorts = useMemo(
    () => [...outputPorts, ...dynamicPorts.outputs],
    [outputPorts, dynamicPorts.outputs],
  );
  const effectiveInputPorts = useMemo(() => {
    if (fnKey !== "ai.chat" && fnKey !== "ai.assistant") {
      return allInputPorts;
    }
    return allInputPorts.map((port) => {
      if (
        fnKey === "ai.chat" &&
        port.key === "model" &&
        modelOptions.length > 0
      ) {
        return { ...port, options: modelOptions };
      }
      if (
        fnKey === "ai.assistant" &&
        port.key === "assistantId" &&
        assistantOptions.length > 0
      ) {
        return { ...port, options: assistantOptions };
      }
      return port;
    });
  }, [allInputPorts, fnKey, modelOptions, assistantOptions]);
  const provider =
    fnKey === "outlook.send" || fnKey === "outlook.trigger"
      ? "outlook"
      : fnKey === "gmail.send" || fnKey === "gmail.trigger"
        ? "gmail"
        : fnKey === "google.sheets" ||
            fnKey === "google.docs" ||
            fnKey === "google.slides"
          ? "google"
          : fnKey === "slack.send" || fnKey === "slack.trigger"
            ? "slack"
            : fnKey === "discord.send" || fnKey === "discord.trigger"
              ? "discord"
              : fnKey === "whatsapp.send" || fnKey === "whatsapp.trigger"
                ? "whatsapp"
                : null;

  const hasHandle = (port: PortDef) =>
    port.input !== "file" && port.input !== "credentials";

  return (
    <div
      className={`min-w-[160px] rounded-lg border-2 bg-surface-card px-3 py-2 shadow-soft ${
        selected ? "border-primary" : "border-hairline-strong"
      }`}
    >
      <div className="mb-2 text-sm font-semibold text-ink">{label}</div>

      {effectiveInputPorts.length > 0 && (
        <div className="mb-2 space-y-1">
          {effectiveInputPorts.map((port) => {
            if (port.input === "file") {
              return (
                <div key={port.key} className="mb-1">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-hairline-strong bg-canvas-soft px-3 py-4 text-center transition hover:border-primary/50 hover:bg-surface-strong">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-muted"
                    >
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                    <span className="text-xs font-medium text-body">
                      {uploadedFileName || "Elegir archivo"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".txt,.md,.markdown,.log,.json,.xml,.html,.css,.js,.ts,.py,.rb,.go,.java,.yaml,.yml,.sh,.sql,.ini,.tsv,.csv,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff,.tif"
                      onChange={(e) =>
                        onNodeFileSelect?.(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>
              );
            }

            if (port.input === "credentials" && provider) {
              return (
                <div key={port.key} className="mb-1">
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted">{port.key}</span>
                    <TypeBadge type={port.type} />
                  </div>
                  <CredentialsButton
                    provider={provider}
                    value={inputValues[port.key]}
                    onChange={(v) => onInputChange(port.key, v)}
                  />
                </div>
              );
            }

            const isConnected = connectedInputs[port.key];
            return (
              <div key={port.key} className="relative flex items-center gap-2">
                {hasHandle(port) && (
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={port.key}
                    className="!w-2 !h-2 !border-2 !bg-surface-card !border-hairline-strong"
                    style={{
                      position: "relative",
                      top: "auto",
                      left: "auto",
                      transform: "none",
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[10px] text-muted">
                      {port.key}
                    </span>
                    <TypeBadge type={port.type} />
                  </div>
                  {isConnected ? (
                    <span className="text-[10px] text-semantic-success">
                      connected
                    </span>
                  ) : (
                    renderWidget(port, inputValues[port.key], (value) =>
                      onInputChange(port.key, value),
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allOutputPorts.length > 0 && (
        <div className="space-y-1">
          {allOutputPorts.map((port) => (
            <div
              key={port.key}
              className="relative flex items-center justify-end gap-2"
            >
              <div className="flex items-center gap-1">
                <span className="text-xs text-body">{port.key}</span>
                <TypeBadge type={port.type} />
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={port.key}
                className="!w-2 !h-2 !border-2 !bg-surface-card !border-hairline-strong"
                style={{
                  position: "relative",
                  top: "auto",
                  right: "auto",
                  transform: "none",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  workflow: WorkflowNodeComponent,
};

function EditorInner({
  workflowId,
  initialNodes,
  initialEdges,
  parentWorkflowId,
  onRegisterSave,
  onSave,
  onRun,
  saving,
}: WorkflowEditorProps) {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const [nodeDefs, setNodeDefs] = useState<NodeDef[]>([]);
  const [models, setModels] = useState<Array<{ id: string; name: string }>>([]);
  const [assistants, setAssistants] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [nodeInputs, setNodeInputs] = useState<
    Record<string, Record<string, unknown>>
  >(() => {
    const seed: Record<string, Record<string, unknown>> = {};
    for (const node of initialNodes) {
      seed[String(node.id)] = { ...(node.inputs || {}) };
    }
    return seed;
  });
  const [execSidebarOpen, setExecSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [nodeFiles, setNodeFiles] = useState<Record<string, File | null>>({});
  const [nodeSearch, setNodeSearch] = useState("");
  const [closedCategories, setClosedCategories] = useState<Set<string>>(
    () => new Set(),
  );
  const dragDataRef = useRef<{
    fnKey: string;
    defName: string;
    defId: string;
  } | null>(null);
  const { running, currentExecution } = useAppSelector((s) => s.execution);
  const dispatch = useAppDispatch();
  const [isDark, setIsDark] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelExecution = async () => {
    if (!currentExecution?._id || cancelling) return;
    setCancelling(true);
    try {
      await workflowApi.cancelExecution(currentExecution._id);
      dispatch(setExecutionRunning(false));
      dispatch(updateExecutionStatus({ status: "cancelled" }));
    } catch {
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const visibleNodeDefs = useMemo(() => {
    if (parentWorkflowId) {
      return nodeDefs;
    }
    return nodeDefs.filter(
      (def) => def.fnKey !== "get.inputs" && def.fnKey !== "send.outputs",
    );
  }, [nodeDefs, parentWorkflowId]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const def of visibleNodeDefs) {
      set.add(def.category);
    }
    return [...set].sort();
  }, [visibleNodeDefs]);

  const filteredByCategory = useCallback(
    (category: string) => {
      const query = nodeSearch.trim().toLowerCase();
      return visibleNodeDefs.filter(
        (def) =>
          def.category === category &&
          (query === "" ||
            def.name.toLowerCase().includes(query) ||
            def.fnKey.toLowerCase().includes(query)),
      );
    },
    [visibleNodeDefs, nodeSearch],
  );

  const nodeDefMap = useMemo(() => {
    const map = new Map<string, NodeDef>();
    for (const def of nodeDefs) {
      map.set(def._id, def);
    }
    return map;
  }, [nodeDefs]);

  const connectedInputs = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    for (const edge of initialEdges) {
      if (!map[String(edge.targetNodeId)]) {
        map[String(edge.targetNodeId)] = {};
      }
      map[String(edge.targetNodeId)][edge.targetKey] = true;
    }
    return map;
  }, [initialEdges]);

  const modelOptions = useMemo(
    () => models.map((model) => ({ value: model.id, label: model.name })),
    [models],
  );
  const assistantOptions = useMemo(
    () =>
      assistants.map((assistant) => ({
        value: assistant._id,
        label: assistant.name,
      })),
    [assistants],
  );

  const rfNodes: Node[] = useMemo(
    () =>
      initialNodes.map((n) => {
        const def = nodeDefMap.get(n.nodeDefinitionId as string);
        return {
          id: String(n.id),
          type: "workflow",
          position: { x: n.x, y: n.y },
          data: {
            label: n.name || def?.name || `Node ${n.id}`,
            fnKey: def?.fnKey || n.nodeDefinitionId,
            nodeDefinitionId: n.nodeDefinitionId,
            nodeId: n.id,
            nodeDef: def,
            inputValues: nodeInputs[String(n.id)] || {},
            connectedInputs: connectedInputs[String(n.id)] || {},
            modelOptions,
            assistantOptions,
            uploadedFileName: nodeFiles[String(n.id)]?.name ?? null,
            onNodeFileSelect: (file: File | null) => {
              setNodeFiles((prev) => ({
                ...prev,
                [String(n.id)]: file ?? null,
              }));
            },
            onInputChange: (key: string, value: unknown) => {
              setNodeInputs((prev) => ({
                ...prev,
                [String(n.id)]: { ...prev[String(n.id)], [key]: value },
              }));
            },
          },
        };
      }),
    [
      initialNodes,
      nodeDefMap,
      nodeInputs,
      connectedInputs,
      nodeFiles,
      modelOptions,
      assistantOptions,
    ],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      initialEdges.map((e, i) => ({
        id: `e${i}`,
        source: String(e.sourceNodeId),
        target: String(e.targetNodeId),
        sourceHandle: e.sourceKey,
        targetHandle: e.targetKey,
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: true,
      })),
    [initialEdges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  useEffect(() => {
    if (!running || !currentExecution?._id) {
      return;
    }
    const id = setInterval(() => {
      dispatch(fetchExecution(currentExecution._id));
    }, 2000);
    return () => clearInterval(id);
  }, [running, currentExecution?._id, dispatch]);

  useEffect(() => {
    nodeDefinitionsApi.list().then(({ data }) => {
      setNodeDefs(data.definitions);
    });
    api
      .get("/models")
      .then(({ data }) => setModels(data.models ?? []))
      .catch(() => {});
    assistantsApi
      .list()
      .then(({ data }) => setAssistants(data.assistants ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const nodeExecutions = currentExecution?.nodeExecutions;
    if (!nodeExecutions?.length) {
      return;
    }
    const next: Record<string, Record<string, unknown>> = {};
    for (const ne of nodeExecutions) {
      if (ne.inputData) {
        next[String(ne.nodeId)] = ne.inputData as Record<string, unknown>;
      }
    }
    if (Object.keys(next).length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      setNodeInputs((prev) => {
        const merged = { ...prev };
        for (const [nodeId, inputs] of Object.entries(next)) {
          merged[nodeId] = { ...(merged[nodeId] || {}), ...inputs };
        }
        return merged;
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [currentExecution]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const rfNode = rfNodes.find((rn) => rn.id === n.id);
        if (!rfNode) return n;
        return {
          ...n,
          data: {
            ...n.data,
            label: rfNode.data.label,
            fnKey: rfNode.data.fnKey,
            nodeDef: rfNode.data.nodeDef,
            uploadedFileName: rfNode.data.uploadedFileName,
            onNodeFileSelect: rfNode.data.onNodeFileSelect,
          },
        };
      }),
    );
  }, [rfNodes, setNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, inputValues: nodeInputs[n.id] || {} },
      })),
    );
  }, [nodeInputs, setNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          uploadedFileName: nodeFiles[n.id]?.name ?? null,
        },
      })),
    );
  }, [nodeFiles, setNodes]);

  useEffect(() => {
    const connected: Record<string, Record<string, boolean>> = {};
    for (const edge of edges) {
      if (!connected[edge.target]) connected[edge.target] = {};
      connected[edge.target][edge.targetHandle || "default"] = true;
    }
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, connectedInputs: connected[n.id] || {} },
      })),
    );
  }, [edges, setNodes]);

  const getPortType = useCallback(
    (nodeId: string, portKey: string, kind: "input" | "output") => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) {
        return undefined;
      }
      const def = nodeDefMap.get(node.data.nodeDefinitionId as string);
      if (
        def?.fnKey === "run.workflow" ||
        def?.fnKey === "get.inputs" ||
        def?.fnKey === "send.outputs"
      ) {
        if (/^input\d+$/.test(portKey) || /^output\d+$/.test(portKey)) {
          return "any";
        }
      }
      if (
        kind === "output" &&
        def?.fnKey === "switch" &&
        (portKey === "default" || /^case\d+$/.test(portKey))
      ) {
        return "any";
      }
      const ports = kind === "input" ? def?.inputs : def?.outputs;
      return ports?.find((p) => p.key === portKey)?.type;
    },
    [nodes, nodeDefMap],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceType = getPortType(
        params.source ?? "",
        params.sourceHandle ?? "default",
        "output",
      );
      const targetType = getPortType(
        params.target ?? "",
        params.targetHandle ?? "default",
        "input",
      );
      if (!isTypeCompatible(sourceType, targetType)) {
        alert(
          `Tipos incompatibles: no se puede conectar ${sourceType ?? "?"} → ${targetType ?? "?"}`,
        );
        return;
      }
      setEdges((eds) => {
        const filtered = eds.filter(
          (e) =>
            !(
              e.target === params.target &&
              e.targetHandle === params.targetHandle
            ),
        );
        return addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            animated: true,
          },
          filtered,
        );
      });
    },
    [setEdges, getPortType],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      let defId: string | null = null;
      try {
        const json = event.dataTransfer.getData("application/json");
        if (json) defId = (JSON.parse(json) as { defId: string }).defId;
      } catch {}
      if (!defId) defId = event.dataTransfer.getData("text/plain") || null;
      const dragData = dragDataRef.current;
      if (!defId) defId = dragData?.defId ?? null;
      if (!defId) return;

      const maxId = Math.max(
        0,
        ...nodes.map((n) => parseInt(n.id) || 0),
        ...initialNodes.map((n) => n.id || 0),
      );
      const newId = maxId + 1;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const def =
        nodeDefMap.get(defId) ||
        (dragData ? nodeDefMap.get(dragData.defId) : undefined);
      const defaultInputs: Record<string, unknown> = {};
      if (def) {
        for (const input of def.inputs) {
          if (input.defaultValue !== undefined)
            defaultInputs[input.key] = input.defaultValue;
        }
      }
      setNodeInputs((prev) => ({ ...prev, [String(newId)]: defaultInputs }));

      setNodes((nds) => [
        ...nds,
        {
          id: String(newId),
          type: "workflow",
          position: { x: position.x, y: position.y },
          data: {
            label: def?.name ?? dragData?.defName ?? "Node",
            fnKey: def?.fnKey ?? dragData?.fnKey ?? "",
            nodeDefinitionId: def?._id ?? defId,
            nodeId: newId,
            nodeDef: def,
            inputValues: defaultInputs,
            connectedInputs: {},
            modelOptions,
            assistantOptions,
            uploadedFileName: null,
            onNodeFileSelect: (file: File | null) => {
              setNodeFiles((prev) => ({
                ...prev,
                [String(newId)]: file ?? null,
              }));
            },
            onInputChange: (key: string, value: unknown) => {
              setNodeInputs((prev) => ({
                ...prev,
                [String(newId)]: { ...prev[String(newId)], [key]: value },
              }));
            },
          },
        },
      ]);

      dragDataRef.current = null;
    },
    [
      reactFlowInstance,
      nodes,
      nodeDefMap,
      setNodes,
      setNodeInputs,
      modelOptions,
      assistantOptions,
    ],
  );

  const fileUploadDefIds = useMemo(() => {
    const ids = new Set<string>();
    for (const def of nodeDefs) {
      if (def.fnKey === "file.upload") {
        ids.add(def._id);
      }
    }
    return ids;
  }, [nodeDefs]);

  const hasFileUpload = useMemo(
    () =>
      nodes.some(
        (n) =>
          fileUploadDefIds.has(n.data.nodeDefinitionId as string) ||
          n.data.fnKey === "file.upload",
      ),
    [nodes, fileUploadDefIds],
  );

  const buildSavedState = useCallback(
    (inputOverrides: Record<string, Record<string, unknown>> = {}) => {
      const savedNodes: WorkflowNode[] = nodes.map((n) => {
        const def = n.data.nodeDef as NodeDef | undefined;
        const fileInputKeys = new Set(
          (def?.inputs ?? [])
            .filter((input) => input.type === "file")
            .map((input) => input.key),
        );
        const inputs = {
          ...(inputOverrides[n.id] ?? nodeInputs[n.id] ?? {}),
        };
        for (const key of fileInputKeys) {
          delete inputs[key];
        }
        return {
          id: parseInt(n.id),
          nodeDefinitionId: (n.data.nodeDefinitionId as string) || "",
          name: (n.data.label as string) || "",
          disabled: false,
          x: n.position.x,
          y: n.position.y,
          w: 200,
          h: 80,
          inputs,
        };
      });

      const savedEdges: WorkflowEdge[] = edges.map((e) => ({
        sourceNodeId: parseInt(e.source),
        sourceKey: e.sourceHandle || "default",
        targetNodeId: parseInt(e.target),
        targetKey: e.targetHandle || "default",
      }));

      return { savedNodes, savedEdges };
    },
    [nodes, edges, nodeInputs],
  );

  const handleSave = () => {
    const { savedNodes, savedEdges } = buildSavedState();
    onSave(savedNodes, savedEdges);
  };

  const saveCurrent = useCallback(() => {
    const { savedNodes, savedEdges } = buildSavedState();
    onSave(savedNodes, savedEdges);
  }, [buildSavedState, onSave]);

  useEffect(() => {
    onRegisterSave?.(saveCurrent);
  }, [onRegisterSave, saveCurrent]);

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const def = (node.data?.nodeDef as NodeDef | undefined) ?? null;
      if (def?.fnKey !== "run.workflow") {
        return;
      }
      const nodeId = node.id;
      const openChild = async () => {
        const existingId = String(nodeInputs[nodeId]?.workflowId ?? "").trim();
        if (existingId) {
          const { savedNodes, savedEdges } = buildSavedState();
          onSave(savedNodes, savedEdges);
          router.push(`/workflows/${existingId}`);
          return;
        }
        try {
          const { data } = await workflowCrudApi.create(
            `Workflow hijo`,
            parentWorkflowId || workflowId,
          );
          const childId = data.workflow._id;
          const updatedInputs = {
            ...(nodeInputs[nodeId] || {}),
            workflowId: childId,
          };
          setNodeInputs((prev) => ({
            ...prev,
            [nodeId]: updatedInputs,
          }));
          const { savedNodes, savedEdges } = buildSavedState({
            [nodeId]: updatedInputs,
          });
          onSave(savedNodes, savedEdges);
          router.push(`/workflows/${childId}`);
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : "No se pudo crear el workflow hijo",
          );
        }
      };
      openChild();
    },
    [
      nodeInputs,
      parentWorkflowId,
      workflowId,
      setNodeInputs,
      router,
      buildSavedState,
      onSave,
    ],
  );

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex w-60 shrink-0 flex-col border-r border-hairline-strong bg-canvas-soft">
        <div
          className="min-h-0 flex-1 overflow-y-auto p-4"
          onWheel={(e) => e.stopPropagation()}
        >
          <h3 className="text-display mb-3 text-xs uppercase tracking-wide text-muted">
            Nodos
          </h3>
          <input
            type="search"
            value={nodeSearch}
            onChange={(e) => setNodeSearch(e.target.value)}
            placeholder="Buscar nodos…"
            className="mb-3 w-full rounded-md border border-hairline-strong bg-surface-card px-2.5 py-1.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {categories.map((category) => {
            const defs = filteredByCategory(category);
            if (defs.length === 0) {
              return null;
            }
            const open = !closedCategories.has(category);
            return (
              <div key={`${category}-${nodeSearch}`} className="mb-2">
                <button
                  onClick={() =>
                    setClosedCategories((prev) => {
                      const next = new Set(prev);
                      if (next.has(category)) {
                        next.delete(category);
                      } else {
                        next.add(category);
                      }
                      return next;
                    })
                  }
                  className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted transition hover:text-ink"
                >
                  <span>{category}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="rounded bg-surface-strong px-1 font-mono text-[10px]">
                      {defs.length}
                    </span>
                    <span
                      className={`transition-transform ${open ? "rotate-90" : ""}`}
                    >
                      ›
                    </span>
                  </span>
                </button>
                {open && (
                  <div className="mt-1 space-y-1.5">
                    {defs.map((def) => (
                      <div
                        key={`${def._id}-${nodeSearch}`}
                        draggable
                        data-def-id={def._id}
                        data-fn-key={def.fnKey}
                        data-def-name={def.name}
                        title={`${def.fnKey} ${def._id}`}
                        onDragStart={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          const id = el.getAttribute("data-def-id") ?? def._id;
                          const fnKey =
                            el.getAttribute("data-fn-key") ?? def.fnKey;
                          const name =
                            el.getAttribute("data-def-name") ?? def.name;
                          const payload = JSON.stringify({ defId: id, fnKey });
                          dragDataRef.current = {
                            fnKey,
                            defName: name,
                            defId: id,
                          };
                          e.dataTransfer.setData("text/plain", id);
                          e.dataTransfer.setData("application/json", payload);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setTimeout(() => {
                            dragDataRef.current = null;
                          }, 100);
                        }}
                        className="cursor-grab rounded-md border border-hairline-strong bg-surface-card p-3 text-sm transition hover:border-primary/50 hover:bg-surface-strong active:cursor-grabbing"
                      >
                        <div className="font-medium text-ink">{def.name}</div>
                        <div className="text-xs text-muted">{def.fnKey}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-hairline-strong bg-surface-card px-4 py-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-secondary disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            onClick={() => {
              if (running) {
                handleCancelExecution();
                return;
              }
              const { savedNodes, savedEdges } = buildSavedState();
              if (hasFileUpload) {
                const uploadNode = nodes.find(
                  (n) =>
                    fileUploadDefIds.has(n.data.nodeDefinitionId as string) ||
                    n.data.fnKey === "file.upload",
                );
                const file = uploadNode ? nodeFiles[uploadNode.id] : undefined;
                if (!file) {
                  alert(
                    "Elegí un archivo en el nodo File Upload antes de ejecutar.",
                  );
                  return;
                }
                onRun(file, savedNodes, savedEdges);
              } else {
                onRun(undefined, savedNodes, savedEdges);
              }
              setExecSidebarOpen(true);
            }}
            disabled={cancelling}
            className="btn-primary"
          >
            {running ? "Detener" : "Correr"}
          </button>
          {running && (
            <button
              onClick={() => setExecSidebarOpen((v) => !v)}
              className={`rounded-md border px-3 py-1.5 text-sm transition cursor-pointer ${
                execSidebarOpen
                  ? "border-primary/50 bg-primary/10 text-primary-active"
                  : "border-hairline-strong bg-surface-card text-body hover:bg-surface-strong"
              }`}
            >
              Ejecución
            </button>
          )}
          <button
            onClick={() => setChatOpen((v) => !v)}
            className={`rounded-md border px-3 py-1.5 text-sm transition cursor-pointer ${
              chatOpen
                ? "border-primary/50 bg-primary/10 text-primary-active"
                : "border-hairline-strong bg-surface-card text-body hover:bg-surface-strong"
            }`}
          >
            Asistente
          </button>
          <div className="ml-auto text-xs text-muted">
            Arrastrá nodos · Conectá salidas → entradas
          </div>
        </div>

        <div className="flex-1 flex">
          <div
            key={workflowId}
            ref={reactFlowWrapper}
            className="flex-1"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDoubleClick={handleNodeDoubleClick}
              nodeTypes={nodeTypes}
              fitView
              deleteKeyCode="Delete"
              className="bg-canvas-soft"
            >
              <Background />
              <div id="rf-controls">
                <Controls />
              </div>
              <div id="rf-minimap">
                <MiniMap
                  nodeColor={isDark ? "#8a94a8" : undefined}
                  maskColor={isDark ? "rgba(138,180,255,0.15)" : undefined}
                />
              </div>
            </ReactFlow>
          </div>
          <ExecutionSidebar
            open={execSidebarOpen}
            onClose={() => setExecSidebarOpen(false)}
            nodes={initialNodes}
          />
          <WorkflowChat
            workflowId={workflowId}
            open={chatOpen}
            onClose={() => setChatOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}

export default function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}
