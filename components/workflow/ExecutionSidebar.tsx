"use client";

import { useEffect, useRef, useState } from "react";
import { WorkflowNode, NodeExecutionStatus } from "@/lib/types";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import {
  setNodeStatus,
  setExecutionRunning,
  updateExecutionStatus,
  fetchExecution,
} from "@/store/executionSlice";
import {
  connectSocket,
  subscribeExecution,
  unsubscribeExecution,
} from "@/lib/socket";

const statusColor: Record<NodeExecutionStatus, string> = {
  pending: "bg-surface-strong text-body",
  running: "bg-accent-warning/10 text-accent-warning",
  completed: "bg-semantic-success/10 text-semantic-success",
  failed: "bg-semantic-error/10 text-semantic-error",
  skipped: "bg-surface-strong text-muted",
};

const statusIcon: Record<NodeExecutionStatus, string> = {
  pending: "○",
  running: "◌",
  completed: "✓",
  failed: "✕",
  skipped: "―",
};

function JsonBlock({ data }: { data: unknown }) {
  if (data === undefined || data === null || data === "") {
    return <p className="text-xs text-muted-soft">—</p>;
  }
  const text = JSON.stringify(data, null, 2);
  return (
    <pre className="max-h-40 overflow-auto rounded border border-hairline bg-canvas-soft p-2 text-[10px] text-body">
      {text}
    </pre>
  );
}

interface ExecutionSidebarProps {
  open: boolean;
  onClose: () => void;
  nodes: WorkflowNode[];
}

export default function ExecutionSidebar({
  open,
  onClose,
  nodes,
}: ExecutionSidebarProps) {
  const dispatch = useAppDispatch();
  const { currentExecution, nodeStatuses, running } = useAppSelector(
    (s) => s.execution,
  );
  const socketSubscribed = useRef(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!open || !currentExecution?._id) return;

    const socket = connectSocket();
    const executionId = currentExecution._id;

    const setupSubscription = () => {
      subscribeExecution(executionId);
      socketSubscribed.current = true;
    };

    const onWorkflowCompleted = (payload: {
      executionId: string;
      duration: number;
    }) => {
      dispatch(setExecutionRunning(false));
      dispatch(
        updateExecutionStatus({
          status: "completed",
          duration: payload.duration,
        }),
      );
    };

    const onWorkflowFailed = (payload: {
      executionId: string;
      error?: string;
    }) => {
      dispatch(setExecutionRunning(false));
      dispatch(
        updateExecutionStatus({ status: "failed", error: payload.error }),
      );
    };

    const onNodeStarted = (payload: {
      executionId: string;
      nodeId: number;
    }) => {
      dispatch(setNodeStatus({ nodeId: payload.nodeId, status: "running" }));
    };

    const onNodeCompleted = (payload: {
      executionId: string;
      nodeId: number;
    }) => {
      dispatch(setNodeStatus({ nodeId: payload.nodeId, status: "completed" }));
    };

    const onNodeFailed = (payload: {
      executionId: string;
      nodeId: number;
      error?: string;
    }) => {
      dispatch(setNodeStatus({ nodeId: payload.nodeId, status: "failed" }));
    };

    const onNodeSkipped = (payload: {
      executionId: string;
      nodeId: number;
    }) => {
      dispatch(setNodeStatus({ nodeId: payload.nodeId, status: "skipped" }));
    };

    if (socket.connected) {
      setupSubscription();
    }

    socket.on("connect", setupSubscription);
    socket.on("workflow.completed", onWorkflowCompleted);
    socket.on("workflow.failed", onWorkflowFailed);
    socket.on("node.started", onNodeStarted);
    socket.on("node.completed", onNodeCompleted);
    socket.on("node.failed", onNodeFailed);
    socket.on("node.skipped", onNodeSkipped);

    return () => {
      socket.off("connect", setupSubscription);
      socket.off("workflow.completed", onWorkflowCompleted);
      socket.off("workflow.failed", onWorkflowFailed);
      socket.off("node.started", onNodeStarted);
      socket.off("node.completed", onNodeCompleted);
      socket.off("node.failed", onNodeFailed);
      socket.off("node.skipped", onNodeSkipped);
      unsubscribeExecution(executionId);
      socketSubscribed.current = false;
    };
  }, [open, currentExecution?._id, dispatch]);

  useEffect(() => {
    if (!open || !running || !currentExecution?._id) return;
    const id = setInterval(() => {
      dispatch(fetchExecution(currentExecution._id));
    }, 3000);
    return () => clearInterval(id);
  }, [open, running, currentExecution?._id, dispatch]);

  if (!open) return null;

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-hairline-strong bg-surface-card">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h3 className="text-display text-sm text-ink">Ejecución</h3>
        <button
          onClick={onClose}
          className="cursor-pointer text-lg leading-none text-muted hover:text-ink"
        >
          &times;
        </button>
      </div>

      <div className="border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              running
                ? "animate-pulse bg-accent-warning"
                : currentExecution?.status === "completed"
                  ? "bg-semantic-success"
                  : currentExecution?.status === "failed"
                    ? "bg-semantic-error"
                    : "bg-muted-soft"
            }`}
          />
          <span className="text-sm font-medium capitalize text-ink">
            {currentExecution?.status || "idle"}
          </span>
        </div>
        {currentExecution?.duration != null && (
          <p className="mt-1 text-xs text-muted">
            {(currentExecution.duration / 1000).toFixed(1)}s
          </p>
        )}
        {currentExecution?.error && (
          <p className="mt-1 text-xs text-semantic-error">
            {currentExecution.error}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {nodes.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-muted">
            Sin nodos en el workflow
          </div>
        ) : (
          nodes.map((node) => {
            const status = nodeStatuses[node.id] || "pending";
            const exec = currentExecution?.nodeExecutions?.find(
              (e) => e.nodeId === node.id,
            );
            const isExpanded = !!expanded[node.id];
            const error = exec?.error;
            return (
              <div key={node.id} className="border-b border-hairline">
                <button
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [node.id]: !prev[node.id],
                    }))
                  }
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-canvas-soft cursor-pointer"
                >
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-medium ${statusColor[status]}`}
                  >
                    {statusIcon[status]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {node.name || `Node ${node.id}`}
                    </p>
                    <p className="text-xs text-muted capitalize">{status}</p>
                  </div>
                  {error && (
                    <span className="text-xs text-semantic-error">✕</span>
                  )}
                  <span
                    className={`text-muted transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  >
                    ›
                  </span>
                </button>

                {isExpanded && (
                  <div className="space-y-2 px-4 pb-3">
                    {error && (
                      <p className="break-words text-xs text-semantic-error">
                        {error}
                      </p>
                    )}
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted">
                        Entradas
                      </p>
                      <JsonBlock data={exec?.inputData} />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted">
                        Salidas
                      </p>
                      <JsonBlock data={exec?.outputData} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
