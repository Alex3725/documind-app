import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

// ============================================================
// TYPES
// ============================================================

export type ClassificationEntry = {
  type: string;
  confidence: number;
};

export type AnalysisResult = {
  type: "CLASSIFIED" | "CONFIRMATION_REQUIRED" | "LOW_CONFIDENCE";
  file_id: string;
  filename: string;
  classifications: ClassificationEntry[];
  assignedTags?: string[];
  options?: ClassificationEntry[];
  message: string;
  extracted_data?: Record<string, unknown>;
  suggestedFolder?: string;
  saved_file_id?: number;
};

export type FileItem = {
  id: string;
  filename: string;
  uploadedAt: string;
  analysisResult: AnalysisResult;
  confirmedType?: string;
  tags: string[];
  folder: string;
};

type FileState = {
  files: FileItem[];
  pendingAnalysis: AnalysisResult | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  uploadProgress: number;
};

const initialState: FileState = {
  files: [],
  pendingAnalysis: null,
  status: "idle",
  error: null,
  uploadProgress: 0,
};

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const obj = payload as Record<string, unknown>;

  if (typeof obj.message === "string" && obj.message.trim()) {
    return obj.message;
  }

  if (typeof obj.error === "string" && obj.error.trim()) {
    return obj.error;
  }

  if (typeof obj.details === "string" && obj.details.trim()) {
    return obj.details;
  }

  if (typeof obj.code === "string" && obj.code.trim()) {
    return `${fallback} (${obj.code})`;
  }

  return fallback;
}

// ============================================================
// THUNKS
// ============================================================

export const uploadAndAnalyze = createAsyncThunk<
  AnalysisResult,
  File,
  { rejectValue: string }
>("files/uploadAndAnalyze", async (file, thunkApi) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/classify/analyze", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = JSON.parse(text);
  } catch {
    if (!response.ok && text.trim()) {
      return thunkApi.rejectWithValue(text.trim());
    }
    return thunkApi.rejectWithValue("Risposta non valida dal server.");
  }

  if (!response.ok) {
    return thunkApi.rejectWithValue(
      extractErrorMessage(data, "Errore durante l'analisi.")
    );
  }

  return data as AnalysisResult;
});

export const confirmClassification = createAsyncThunk<
  AnalysisResult,
  { fileId: string; confirmedType: string; additionalTags?: string[] },
  { rejectValue: string }
>("files/confirmClassification", async (payload, thunkApi) => {
  const response = await fetch("/api/classify/confirm", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_id: payload.fileId,
      confirmed_type: payload.confirmedType,
      additionalTags: payload.additionalTags ?? [],
    }),
  });

  const data = await response.json() as unknown;
  if (!response.ok) {
    return thunkApi.rejectWithValue(
      extractErrorMessage(data, "Errore durante la conferma.")
    );
  }

  return data as AnalysisResult;
});

// ============================================================
// SLICE
// ============================================================

const fileSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    clearPendingAnalysis(state) {
      state.pendingAnalysis = null;
    },
    addFileFromResult(state, action: PayloadAction<{ result: AnalysisResult; filename: string }>) {
      const { result, filename } = action.payload;
      const fileItem: FileItem = {
        id: result.file_id,
        filename,
        uploadedAt: new Date().toISOString(),
        analysisResult: result,
        tags: result.assignedTags ?? [],
        folder: result.suggestedFolder ?? "Other",
      };
      state.files.unshift(fileItem);
    },
    updateFileConfirmation(
      state,
      action: PayloadAction<{ fileId: string; confirmedType: string; result: AnalysisResult }>
    ) {
      const { fileId, confirmedType, result } = action.payload;
      const idx = state.files.findIndex((f) => f.id === fileId);
      if (idx !== -1) {
        state.files[idx].confirmedType = confirmedType;
        state.files[idx].tags = result.assignedTags ?? [];
        state.files[idx].folder = result.suggestedFolder ?? "Other";
        state.files[idx].analysisResult = result;
      }
    },
    removeFile(state, action: PayloadAction<string>) {
      state.files = state.files.filter((f) => f.id !== action.payload);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadAndAnalyze.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.pendingAnalysis = null;
      })
      .addCase(uploadAndAnalyze.fulfilled, (state, action) => {
        state.status = "succeeded";
        const result = action.payload;

        if (result.type === "CONFIRMATION_REQUIRED") {
          state.pendingAnalysis = result;
        } else {
          // Auto-add to files list
          const fileItem: FileItem = {
            id: result.file_id,
            filename: result.filename,
            uploadedAt: new Date().toISOString(),
            analysisResult: result,
            tags: result.assignedTags ?? [],
            folder: result.suggestedFolder ?? "Other",
          };
          state.files.unshift(fileItem);
        }
      })
      .addCase(uploadAndAnalyze.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Errore sconosciuto.";
      })
      .addCase(confirmClassification.fulfilled, (state, action) => {
        const result = action.payload;
        state.pendingAnalysis = null;

        const fileItem: FileItem = {
          id: result.file_id,
          filename: result.filename,
          uploadedAt: new Date().toISOString(),
          analysisResult: result,
          confirmedType: result.message?.split(": ")[1],
          tags: result.assignedTags ?? [],
          folder: result.suggestedFolder ?? "Other",
        };
        state.files.unshift(fileItem);
      })
      .addCase(confirmClassification.rejected, (state, action) => {
        state.error = action.payload ?? "Errore durante la conferma.";
      });
  },
});

export const {
  clearPendingAnalysis,
  addFileFromResult,
  updateFileConfirmation,
  removeFile,
  clearError,
} = fileSlice.actions;

export default fileSlice.reducer;
