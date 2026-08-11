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
import { nodeDefinitionsApi } from "@/lib/api";
import { useAppSelector } from "@/lib/hooks";
import ExecutionSidebar from "./ExecutionSidebar";

interface WorkflowEditorProps {
  workflowId: string;
  initialNodes: WorkflowNode[];
  initialEdges: WorkflowEdge[];
  onSave: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onRun: () => void;
  saving: boolean;
}

type PortDef = {
  key: string;
  type: string;
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

function WorkflowNodeComponent({ data, selected }: NodeProps) {
  const label = data.label as string;
  const nodeDef = data.nodeDef as NodeDef | undefined;
  const inputValues = (data.inputValues as Record<string, unknown>) || {};
  const connectedInputs =
    (data.connectedInputs as Record<string, boolean>) || {};
  const onInputChange = data.onInputChange as (
    key: string,
    value: unknown,
  ) => void;

  const inputPorts = useMemo(() => nodeDef?.inputs || [], [nodeDef]);
  const outputPorts = useMemo(() => nodeDef?.outputs || [], [nodeDef]);

  const editableTypes = new Set(["number", "string", "boolean"]);

  return (
    <div
      className={`px-3 py-2 bg-white border-2 rounded-xl shadow-sm min-w-[160px] ${
        selected ? "border-blue-500" : "border-gray-300"
      }`}
    >
      <div className="text-sm font-semibold mb-2 text-gray-800">{label}</div>

      {inputPorts.length > 0 && (
        <div className="mb-2 space-y-1">
          {inputPorts.map((port) => {
            const isConnected = connectedInputs[port.key];
            return (
              <div key={port.key} className="relative flex items-center gap-2">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={port.key}
                  className="!w-2 !h-2 !border-2 !bg-white !border-gray-400"
                />
                {editableTypes.has(port.type) ? (
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block leading-tight">
                      {port.key}
                    </label>
                    {isConnected ? (
                      <span className="text-[10px] text-green-600">
                        connected
                      </span>
                    ) : (
                      <input
                        type={port.type === "number" ? "number" : "text"}
                        value={(inputValues[port.key] as string | number) ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          onInputChange(
                            port.key,
                            port.type === "number"
                              ? val === ""
                                ? ""
                                : Number(val)
                              : val,
                          );
                        }}
                        className="w-full px-1 py-0.5 text-xs border border-gray-200 rounded"
                      />
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">{port.key}</span>
                )}
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
              className="relative flex items-center gap-2 justify-end"
            >
              <span className="text-xs text-gray-500">{port.key}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={port.key}
                className="!w-2 !h-2 !border-2 !bg-white !border-gray-400"
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
  >({});
  const [execSidebarOpen, setExecSidebarOpen] = useState(false);
  const dragDataRef = useRef<{
    fnKey: string;
    defName: string;
    defId: string;
  } | null>(null);
  const { running } = useAppSelector((s) => s.execution);

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
            onInputChange: (key: string, value: unknown) => {
              setNodeInputs((prev) => ({
                ...prev,
                [String(n.id)]: { ...prev[String(n.id)], [key]: value },
              }));
            },
          },
        };
      }),
    [initialNodes, nodeDefMap, nodeInputs, connectedInputs],
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
    nodeDefinitionsApi.list().then(({ data }) => {
      setNodeDefs(data.definitions);
    });
  }, []);

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

  const onConnect = useCallback(
    (params: Connection) => {
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
    [setEdges],
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

  const handleSave = () => {
    const savedNodes: WorkflowNode[] = nodes.map((n) => ({
      id: parseInt(n.id),
      nodeDefinitionId: (n.data.nodeDefinitionId as string) || "",
      name: (n.data.label as string) || "",
      disabled: false,
      x: n.position.x,
      y: n.position.y,
      w: 200,
      h: 80,
      inputs: nodeInputs[n.id] || {},
    }));

    const savedEdges: WorkflowEdge[] = edges.map((e) => ({
      sourceNodeId: parseInt(e.source),
      sourceKey: e.sourceHandle || "default",
      targetNodeId: parseInt(e.target),
      targetKey: e.targetHandle || "default",
    }));

    onSave(savedNodes, savedEdges);
  };

  return (
    <div className="flex h-full">
      <div className="w-60 bg-white border-r border-gray-200 p-4 overflow-y-auto shrink-0">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
          Nodes
        </h3>
        {nodeDefs.map((def) => (
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
            className="mb-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-400 hover:bg-blue-50 transition text-sm"
          >
            <div className="font-medium">{def.name}</div>
            <div className="text-xs text-gray-400">{def.fnKey}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              onRun();
              setExecSidebarOpen(true);
            }}
            className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition cursor-pointer"
          >
            {running ? "Running..." : "Run"}
          </button>
          {running && (
            <button
              onClick={() => setExecSidebarOpen((v) => !v)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition cursor-pointer ${
                execSidebarOpen
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Execution
            </button>
          )}
          <div className="text-xs text-gray-400 ml-auto">
            Drag & drop nodes · Connect outputs → inputs
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
              className="bg-gray-50"
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
