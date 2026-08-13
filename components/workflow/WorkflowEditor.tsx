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
import { WorkflowNode, WorkflowEdge } from "@/lib/types";
import api, { nodeDefinitionsApi } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchExecution } from "@/store/executionSlice";
import ExecutionSidebar from "./ExecutionSidebar";

interface WorkflowEditorProps {
  workflowId: string;
  initialNodes: WorkflowNode[];
  initialEdges: WorkflowEdge[];
  onSave: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onRun: (
    file: File | undefined,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
  ) => void;
  saving: boolean;
}

type PortDef = {
  key: string;
  type: string;
  input?: string;
  options?: string[];
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
  array: "array",
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
    (targetType === "object" || targetType === "array")
  ) {
    return true;
  }
  if (
    (sourceType === "object" || sourceType === "array") &&
    targetType === "json"
  ) {
    return true;
  }
  return false;
}

function CredentialsButton({ provider }: { provider: string }) {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    api
      .get(`/credentials/${provider}`)
      .then(({ data }) => {
        setConnected(!!data.connected);
        setEmail(data.email ?? null);
      })
      .catch(() => setConnected(false));
  }, [provider]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
        {(port.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
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
  const outputPorts = useMemo(() => nodeDef?.outputs || [], [nodeDef]);
  const provider =
    fnKey === "outlook.send"
      ? "outlook"
      : fnKey === "gmail.send"
        ? "gmail"
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

      {inputPorts.length > 0 && (
        <div className="mb-2 space-y-1">
          {inputPorts.map((port) => {
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
                  <CredentialsButton provider={provider} />
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

      {outputPorts.length > 0 && (
        <div className="space-y-1">
          {outputPorts.map((port) => (
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
  onSave,
  onRun,
  saving,
}: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const [nodeDefs, setNodeDefs] = useState<NodeDef[]>([]);
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const def of nodeDefs) {
      set.add(def.category);
    }
    return [...set].sort();
  }, [nodeDefs]);

  const filteredByCategory = useCallback(
    (category: string) => {
      const query = nodeSearch.trim().toLowerCase();
      return nodeDefs.filter(
        (def) =>
          def.category === category &&
          (query === "" ||
            def.name.toLowerCase().includes(query) ||
            def.fnKey.toLowerCase().includes(query)),
      );
    },
    [nodeDefs, nodeSearch],
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
    [initialNodes, nodeDefMap, nodeInputs, connectedInputs, nodeFiles],
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
      const dragData = dragDataRef.current;
      if (!dragData) return;

      const draggedKey = event.dataTransfer.getData("text/plain");
      if (draggedKey !== dragData.fnKey) return;

      const maxId = nodes.reduce((max, n) => Math.max(max, parseInt(n.id)), 0);
      const newId = maxId + 1;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const def = nodeDefMap.get(dragData.defId);
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
            label: dragData.defName,
            fnKey: dragData.fnKey,
            nodeDefinitionId: dragData.defId,
            nodeId: newId,
            nodeDef: def,
            inputValues: defaultInputs,
            connectedInputs: {},
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
    [reactFlowInstance, nodes, nodeDefMap, setNodes, setNodeInputs],
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

  const buildSavedState = useCallback(() => {
    const savedNodes: WorkflowNode[] = nodes.map((n) => {
      const def = n.data.nodeDef as NodeDef | undefined;
      const fileInputKeys = new Set(
        (def?.inputs ?? [])
          .filter((input) => input.type === "file")
          .map((input) => input.key),
      );
      const inputs = { ...(nodeInputs[n.id] || {}) };
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
  }, [nodes, edges, nodeInputs]);

  const handleSave = () => {
    const { savedNodes, savedEdges } = buildSavedState();
    onSave(savedNodes, savedEdges);
  };

  return (
    <div className="flex h-full">
      <div className="w-60 shrink-0 overflow-y-auto border-r border-hairline-strong bg-canvas-soft p-4">
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
            <div key={category} className="mb-2">
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
                      key={def._id}
                      draggable
                      onDragStart={(e) => {
                        dragDataRef.current = {
                          fnKey: def.fnKey,
                          defName: def.name,
                          defId: def._id,
                        };
                        e.dataTransfer.setData("text/plain", def.fnKey);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        dragDataRef.current = null;
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
            className="btn-primary"
          >
            {running ? "Corriendo…" : "Correr"}
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
              nodeTypes={nodeTypes}
              fitView
              deleteKeyCode="Delete"
              className="bg-canvas-soft"
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
          <ExecutionSidebar
            open={execSidebarOpen}
            onClose={() => setExecSidebarOpen(false)}
            nodes={initialNodes}
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
