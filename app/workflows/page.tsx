"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchWorkflows,
  createWorkflow,
  deleteWorkflow,
} from "@/store/workflowSlice";

export default function WorkflowsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { workflows, loading } = useAppSelector((s) => s.workflow);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    dispatch(fetchWorkflows());
  }, [dispatch]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const result = await dispatch(createWorkflow(newName.trim()));
    if (createWorkflow.fulfilled.match(result)) {
      setShowCreate(false);
      setNewName("");
      router.push(`/workflows/${result.payload._id}`);
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Workflows</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
          >
            + New Workflow
          </button>
        </div>

        {showCreate && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Workflow name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition cursor-pointer"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setNewName("");
              }}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
            <p className="text-gray-500 mb-4">No workflows yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer"
            >
              Create your first workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <div
                key={wf._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/workflows/${wf._id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{wf.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {wf.nodes.length} node{wf.nodes.length !== 1 ? "s" : ""} ·{" "}
                      {wf.edges.length} edge{wf.edges.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Updated {new Date(wf.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/workflows/${wf._id}`);
                    }}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    Open
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this workflow?"))
                        dispatch(deleteWorkflow(wf._id));
                    }}
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Delete
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
