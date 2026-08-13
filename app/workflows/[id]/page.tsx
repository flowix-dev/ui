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

  const handleRun = async (
    file: File | undefined,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
  ) => {
    const saveResult = await dispatch(
      saveWorkflow({ id: params.id as string, nodes, edges }),
    );
    if (!saveWorkflow.fulfilled.match(saveResult)) {
      return;
    }
    dispatch(runWorkflow({ workflowId: params.id as string, file }));
  };

  if (loading && !wf) {
    return (
      <AuthGuard>
        <Navbar />
        <div className="flex h-[calc(100vh-56px)] items-center justify-center text-muted">
          Cargando…
        </div>
      </AuthGuard>
    );
  }

  if (!wf) {
    return (
      <AuthGuard>
        <Navbar />
        <div className="flex h-[calc(100vh-56px)] items-center justify-center text-muted">
          Workflow no encontrado
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col">
          <div className="bg-surface-card shrink-0 border-b border-hairline-strong px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/workflows")}
                className="text-sm text-link hover:underline cursor-pointer"
              >
                ← Workflows
              </button>
              <h1 className="text-display text-lg text-ink">{wf.name}</h1>
            </div>
          </div>
          <div className="flex-1">
            <WorkflowEditor
              key={wf._id}
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
