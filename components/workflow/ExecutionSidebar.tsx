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
  pending: "bg-gray-100 text-gray-500",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-yellow-100 text-yellow-700",
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
    return <p className="text-xs text-gray-300">—</p>;
  }
  const text = JSON.stringify(data, null, 2);
  return (
    <pre className="text-[10px] bg-gray-50 border border-gray-100 rounded p-2 overflow-auto text-gray-600 max-h-40">
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
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Execution</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
        >
          &times;
        </button>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              running
                ? "bg-blue-500 animate-pulse"
                : currentExecution?.status === "completed"
                  ? "bg-green-500"
                  : currentExecution?.status === "failed"
                    ? "bg-red-500"
                    : "bg-gray-300"
            }`}
          />
          <span className="text-sm font-medium capitalize">
            {currentExecution?.status || "idle"}
          </span>
        </div>
        {currentExecution?.duration != null && (
          <p className="text-xs text-gray-400 mt-1">
            {(currentExecution.duration / 1000).toFixed(1)}s
          </p>
        )}
        {currentExecution?.error && (
          <p className="text-xs text-red-500 mt-1">{currentExecution.error}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {nodes.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-gray-400">
            No nodes in workflow
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
              <div key={node.id} className="border-b border-gray-50">
                <button
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [node.id]: !prev[node.id],
                    }))
                  }
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left cursor-pointer"
                >
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-medium ${statusColor[status]}`}
                  >
                    {statusIcon[status]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {node.name || `Node ${node.id}`}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{status}</p>
                  </div>
                  {error && <span className="text-red-500 text-xs">✕</span>}
                  <span
                    className={`text-gray-400 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  >
                    ›
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2">
                    {error && (
                      <p className="text-xs text-red-500 break-words">
                        {error}
                      </p>
                    )}
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                        Inputs
                      </p>
                      <JsonBlock data={exec?.inputData} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                        Outputs
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
