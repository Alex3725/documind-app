import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type LoginPayload = {
  email?: string;
  telephone?: string;
  password: string;
};

export type LoginUser = {
  name?: string;
  surname?: string;
  telephone?: string;
  email?: string;
  role?: string;
};

type AuthState = {
  user: LoginUser | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

export const loginUser = createAsyncThunk<
  LoginUser,
  LoginPayload,
  { rejectValue: string }
>("auth/loginUser", async (payload, thunkApi) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  const hasBody = rawText.trim().length > 0;
  let data: unknown = null;

  if (hasBody) {
    try {
      data = JSON.parse(rawText) as unknown;
    } catch {
      data = { message: rawText };
    }
  }

  if (!response.ok) {
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
      return thunkApi.rejectWithValue(data.message);
    }

    return thunkApi.rejectWithValue("Login non riuscito. Verifica le credenziali.");
  }

  if (!data || typeof data !== "object") {
    return thunkApi.rejectWithValue("Risposta login non valida dal server.");
  }

  return data as LoginUser;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    logoutState(state) {
      state.user = null;
      state.status = "idle";
      state.error = null;
    },
    setUser(state, action: PayloadAction<LoginUser>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Errore non previsto durante il login.";
      });
  },
});

export const { clearAuthError, logoutState, setUser } = authSlice.actions;
export default authSlice.reducer;
