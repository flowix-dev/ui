import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { WorkflowExecution, NodeExecutionStatus } from "@/lib/types";
import { workflowApi } from "@/lib/api";

interface ExecutionState {
  currentExecution: WorkflowExecution | null;
  nodeStatuses: Record<number, NodeExecutionStatus>;
  running: boolean;
  executions: WorkflowExecution[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
}

const initialState: ExecutionState = {
  currentExecution: null,
  nodeStatuses: {},
  running: false,
  executions: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
};

export const runWorkflow = createAsyncThunk(
  "execution/run",
  async (workflowId: string, { dispatch }) => {
    const { data } = await workflowApi.run(workflowId);
    const execId = data.execution._id;
    dispatch(fetchExecution(execId));
    return data.execution;
  },
);

export const fetchExecution = createAsyncThunk(
  "execution/fetch",
  async (executionId: string) => {
    const { data } = await workflowApi.getExecution(executionId);
    return data.execution;
  },
);

export const fetchWorkflowExecutions = createAsyncThunk(
  "execution/fetchWorkflowExecutions",
  async ({
    workflowId,
    page,
    limit,
  }: {
    workflowId: string;
    page: number;
    limit: number;
  }) => {
    const { data } = await workflowApi.getWorkflowExecutions(
      workflowId,
      page,
      limit,
    );
    return data;
  },
);

export const fetchUserExecutions = createAsyncThunk(
  "execution/fetchUserExecutions",
  async ({ page, limit }: { page: number; limit: number }) => {
    const { data } = await workflowApi.getUserExecutions(page, limit);
    return data;
  },
);

const executionSlice = createSlice({
  name: "execution",
  initialState,
  reducers: {
    clearCurrentExecution(state) {
      state.currentExecution = null;
      state.nodeStatuses = {};
      state.running = false;
    },
    clearError(state) {
      state.error = null;
    },
    setNodeStatus(
      state,
      action: { payload: { nodeId: number; status: NodeExecutionStatus } },
    ) {
      state.nodeStatuses[action.payload.nodeId] = action.payload.status;
    },
    setExecutionRunning(state, action: { payload: boolean }) {
      state.running = action.payload;
    },
    updateExecutionStatus(
      state,
      action: { payload: Partial<WorkflowExecution> },
    ) {
      if (state.currentExecution) {
        state.currentExecution = {
          ...state.currentExecution,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(runWorkflow.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(runWorkflow.fulfilled, (state, action) => {
      state.loading = false;
      state.currentExecution = action.payload;
      state.nodeStatuses = {};
      state.running = true;
    });
    builder.addCase(runWorkflow.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to run workflow";
    });

    builder.addCase(fetchExecution.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchExecution.fulfilled, (state, action) => {
      state.loading = false;
      state.currentExecution = action.payload;
      for (const ne of action.payload.nodeExecutions || []) {
        state.nodeStatuses[ne.nodeId] = ne.status;
      }
    });
    builder.addCase(fetchExecution.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch execution";
    });

    builder.addCase(fetchWorkflowExecutions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchWorkflowExecutions.fulfilled, (state, action) => {
      state.loading = false;
      state.executions = action.payload.executions;
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.limit = action.payload.limit;
    });
    builder.addCase(fetchWorkflowExecutions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch executions";
    });

    builder.addCase(fetchUserExecutions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserExecutions.fulfilled, (state, action) => {
      state.loading = false;
      state.executions = action.payload.executions;
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.limit = action.payload.limit;
    });
    builder.addCase(fetchUserExecutions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch executions";
    });
  },
});

export const {
  clearCurrentExecution,
  clearError,
  setNodeStatus,
  setExecutionRunning,
  updateExecutionStatus,
} = executionSlice.actions;
export default executionSlice.reducer;
