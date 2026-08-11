"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchUserExecutions } from "@/store/executionSlice";

export default function ExecutionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { executions, total, loading, limit } = useAppSelector(
    (s) => s.execution,
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchUserExecutions({ page: currentPage, limit }));
  }, [dispatch, currentPage, limit]);

  const totalPages = Math.ceil(total / limit);

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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Execution History</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : executions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No executions found.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      Workflow
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      Started
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      Duration
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      Trigger
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {executions.map((exec) => (
                    <tr
                      key={exec._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/executions/${exec._id}`)}
                    >
                      <td className="px-6 py-4 text-sm font-medium">
                        {typeof exec.workflowId === "object" &&
                        exec.workflowId !== null
                          ? (exec.workflowId as { name: string }).name
                          : "Workflow"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(exec.status)}`}
                        >
                          {exec.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(exec.startedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {exec.duration
                          ? `${(exec.duration / 1000).toFixed(1)}s`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {exec.triggerType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </AuthGuard>
  );
}
