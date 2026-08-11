"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchUserExecutions } from "@/store/executionSlice";

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { executions, total, loading } = useAppSelector((s) => s.execution);

  useEffect(() => {
    dispatch(fetchUserExecutions({ page: 1, limit: 5 }));
  }, [dispatch]);

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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.firstName} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            You have {total} execution{total !== 1 ? "s" : ""} in total.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push("/workflows")}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-left hover:shadow-md transition cursor-pointer"
          >
            <h3 className="font-semibold">Run Workflow</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select and execute a workflow
            </p>
          </button>
          <button
            onClick={() => router.push("/executions")}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-left hover:shadow-md transition cursor-pointer"
          >
            <h3 className="font-semibold">View History</h3>
            <p className="text-sm text-gray-500 mt-1">
              Browse all your past executions
            </p>
          </button>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold">Credits</h3>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {user?.credits ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Recent Executions</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : executions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No executions yet. Run a workflow to get started.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {executions.map((exec) => (
                <div
                  key={exec._id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/executions/${exec._id}`)}
                >
                  <div>
                    <p className="font-medium">
                      {typeof exec.workflowId === "object" &&
                      exec.workflowId !== null
                        ? (exec.workflowId as { name: string }).name
                        : "Workflow"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(exec.startedAt).toLocaleString()}
                      {exec.duration
                        ? ` · ${(exec.duration / 1000).toFixed(1)}s`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(exec.status)}`}
                  >
                    {exec.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {executions.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 text-center">
              <button
                onClick={() => router.push("/executions")}
                className="text-sm text-blue-600 hover:underline cursor-pointer"
              >
                View all executions →
              </button>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
