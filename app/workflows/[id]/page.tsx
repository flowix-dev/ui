"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import WorkflowEditor from "@/components/workflow/WorkflowEditor";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchWorkflow, saveWorkflow } from "@/store/workflowSlice";
import { runWorkflow } from "@/store/executionSlice";
import { WorkflowNode, WorkflowEdge } from "@/lib/types";

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    currentWorkflow: wf,
    loading,
    saving,
  } = useAppSelector((s) => s.workflow);

  useEffect(() => {
    if (params.id) {
      dispatch(fetchWorkflow(params.id as string));
    }
  }, [dispatch, params.id]);

  const handleSave = (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    dispatch(saveWorkflow({ id: params.id as string, nodes, edges }));
  };

  const handleRun = () => {
    dispatch(runWorkflow(params.id as string));
  };

  if (loading && !wf) {
    return (
      <AuthGuard>
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-56px)] text-gray-500">
          Loading...
        </div>
      </AuthGuard>
    );
  }

  if (!wf) {
    return (
      <AuthGuard>
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-56px)] text-gray-500">
          Workflow not found
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/workflows")}
                className="text-sm text-blue-600 hover:underline cursor-pointer"
              >
                ← Workflows
              </button>
              <h1 className="text-lg font-semibold">{wf.name}</h1>
            </div>
          </div>
          <div className="flex-1">
            <WorkflowEditor
              workflowId={wf._id}
              initialNodes={wf.nodes}
              initialEdges={wf.edges}
              onSave={handleSave}
              onRun={handleRun}
              saving={saving}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
