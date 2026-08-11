import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import executionReducer from "./executionSlice";
import workflowReducer from "./workflowSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    execution: executionReducer,
    workflow: workflowReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
