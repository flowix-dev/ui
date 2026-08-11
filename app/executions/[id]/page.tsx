"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchExecution } from "@/store/executionSlice";

export default function ExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    currentExecution: exec,
    loading,
    error,
  } = useAppSelector((s) => s.execution);

  useEffect(() => {
    if (params.id) {
      dispatch(fetchExecution(params.id as string));
    }
  }, [dispatch, params.id]);

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "skipped":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">
          Loading...
        </main>
      </AuthGuard>
    );
  }

  if (error || !exec) {
    return (
      <AuthGuard>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            {error || "Execution not found"}
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline mb-4 inline-block cursor-pointer"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              {exec.workflowSnapshot?.name || "Execution"}
            </h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor(exec.status)}`}
            >
              {exec.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Started</span>
              <p className="font-medium">
                {new Date(exec.startedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Duration</span>
              <p className="font-medium">
                {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : "-"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Trigger</span>
              <p className="font-medium capitalize">{exec.triggerType}</p>
            </div>
            <div>
              <span className="text-gray-500">Nodes</span>
              <p className="font-medium">
                {exec.nodeExecutions.length} /{" "}
                {exec.workflowSnapshot?.nodes?.length || 0}
              </p>
            </div>
          </div>

          {exec.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {exec.error}
            </div>
          )}
        </div>

        <h2 className="text-lg font-semibold mb-4">Node Executions</h2>
        <div className="space-y-3">
          {exec.nodeExecutions.map((nodeExec) => (
            <div
              key={nodeExec.nodeId}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {nodeExec.nodeName || `Node ${nodeExec.nodeId}`}
                  </span>
                  <span className="text-xs text-gray-400">
                    ID: {nodeExec.nodeId}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(nodeExec.status)}`}
                >
                  {nodeExec.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-2">
                {nodeExec.startedAt && (
                  <div>
                    <span className="text-gray-400">Started:</span>{" "}
                    {new Date(nodeExec.startedAt).toLocaleTimeString()}
                  </div>
                )}
                {nodeExec.duration !== undefined && (
                  <div>
                    <span className="text-gray-400">Duration:</span>{" "}
                    {(nodeExec.duration / 1000).toFixed(2)}s
                  </div>
                )}
              </div>

              {nodeExec.error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs mb-2">
                  {nodeExec.error}
                </div>
              )}

              {(!!nodeExec.inputData || !!nodeExec.outputData) && (
                <details className="text-xs mt-2">
                  <summary className="cursor-pointer text-blue-600 hover:underline">
                    View data
                  </summary>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {!!nodeExec.inputData && (
                      <div>
                        <p className="font-medium text-gray-500 mb-1">Input:</p>
                        <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40">
                          {
                            JSON.stringify(
                              nodeExec.inputData,
                              null,
                              2,
                            ) as React.ReactNode
                          }
                        </pre>
                      </div>
                    )}
                    {!!nodeExec.outputData && (
                      <div>
                        <p className="font-medium text-gray-500 mb-1">
                          Output:
                        </p>
                        <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40">
                          {
                            JSON.stringify(
                              nodeExec.outputData,
                              null,
                              2,
                            ) as React.ReactNode
                          }
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </main>
    </AuthGuard>
  );
}
