import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from "@/lib/types";
import { authApi } from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
  "auth/login",
  async (credentials) => {
    try {
      const { data } = await authApi.login(credentials);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Login failed"));
    }
  },
);

export const register = createAsyncThunk<AuthResponse, RegisterCredentials>(
  "auth/register",
  async (credentials) => {
    try {
      const { data } = await authApi.register(credentials);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Registration failed"));
    }
  },
);

export const fetchMe = createAsyncThunk<User, void>(
  "auth/fetchMe",
  async () => {
    const { data } = await authApi.me();
    return data.user;
  },
);

export const logout = createAsyncThunk<void, void>("auth/logout", async () => {
  await authApi.logout();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.initialized = true;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.initialized = true;
      state.error = action.error.message || "Login failed";
    });

    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.initialized = true;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Registration failed";
    });

    builder.addCase(fetchMe.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.loading = false;
      state.initialized = true;
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(fetchMe.rejected, (state) => {
      state.loading = false;
      state.initialized = true;
      state.user = null;
      state.isAuthenticated = false;
    });

    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
