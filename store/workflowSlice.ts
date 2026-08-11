import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { WorkflowNode, WorkflowEdge } from "@/lib/types";
import { workflowCrudApi } from "@/lib/api";

interface Workflow {
  _id: string;
  name: string;
  authorId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchWorkflows = createAsyncThunk(
  "workflow/fetchAll",
  async () => {
    const { data } = await workflowCrudApi.list();
    return data.workflows;
  },
);

export const fetchWorkflow = createAsyncThunk(
  "workflow/fetch",
  async (id: string) => {
    const { data } = await workflowCrudApi.get(id);
    return data.workflow;
  },
);

export const createWorkflow = createAsyncThunk(
  "workflow/create",
  async (name: string) => {
    const { data } = await workflowCrudApi.create(name);
    return data.workflow;
  },
);

export const saveWorkflow = createAsyncThunk(
  "workflow/save",
  async ({
    id,
    name,
    nodes,
    edges,
  }: {
    id: string;
    name?: string;
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
  }) => {
    const { data } = await workflowCrudApi.update(id, { name, nodes, edges });
    return data.workflow;
  },
);

export const deleteWorkflow = createAsyncThunk(
  "workflow/delete",
  async (id: string) => {
    await workflowCrudApi.delete(id);
    return id;
  },
);

const workflowSlice = createSlice({
  name: "workflow",
  initialState,
  reducers: {
    clearCurrentWorkflow(state) {
      state.currentWorkflow = null;
    },
    updateWorkflowNodes(state, action) {
      if (state.currentWorkflow) {
        state.currentWorkflow.nodes = action.payload;
      }
    },
    updateWorkflowEdges(state, action) {
      if (state.currentWorkflow) {
        state.currentWorkflow.edges = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkflows.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchWorkflows.fulfilled, (s, a) => {
        s.loading = false;
        s.workflows = a.payload;
      })
      .addCase(fetchWorkflows.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || "Failed to load workflows";
      })
      .addCase(fetchWorkflow.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchWorkflow.fulfilled, (s, a) => {
        s.loading = false;
        s.currentWorkflow = a.payload;
      })
      .addCase(fetchWorkflow.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || "Failed to load workflow";
      })
      .addCase(createWorkflow.pending, (s) => {
        s.loading = true;
      })
      .addCase(createWorkflow.fulfilled, (s, a) => {
        s.loading = false;
        s.workflows.unshift(a.payload);
        s.currentWorkflow = a.payload;
      })
      .addCase(createWorkflow.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || "Failed to create workflow";
      })
      .addCase(saveWorkflow.pending, (s) => {
        s.saving = true;
      })
      .addCase(saveWorkflow.fulfilled, (s, a) => {
        s.saving = false;
        s.currentWorkflow = a.payload;
        const idx = s.workflows.findIndex((w) => w._id === a.payload._id);
        if (idx >= 0) s.workflows[idx] = a.payload;
      })
      .addCase(saveWorkflow.rejected, (s, a) => {
        s.saving = false;
        s.error = a.error.message || "Failed to save";
      })
      .addCase(deleteWorkflow.fulfilled, (s, a) => {
        s.workflows = s.workflows.filter((w) => w._id !== a.payload);
        if (s.currentWorkflow?._id === a.payload) s.currentWorkflow = null;
      });
  },
});

export const {
  clearCurrentWorkflow,
  updateWorkflowNodes,
  updateWorkflowEdges,
} = workflowSlice.actions;
export default workflowSlice.reducer;
