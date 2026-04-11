import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

// ============================================================
// TYPES
// ============================================================

export type TagEntry = {
  name: string;
  confidence: number;
  description?: string;
  category?: string;
  isDefault?: boolean;
};

export type AnalysisResult = {
  type: "CLASSIFIED" | "PARTIAL_CONFIRMATION" | "CONFIRMATION_REQUIRED" | "LOW_CONFIDENCE";
  file_id: string;
  filename: string;
  /** Tag assegnati automaticamente (confidence >= 0.75) */
  tags: TagEntry[];
  /** Nomi dei tag assegnati */
  assigned_tags: string[];
  /** Tag in attesa di conferma (0.45–0.75) */
  pending_tags?: TagEntry[];
  /** Tutti i tag con score > 0.20 (per popup) */
  all_tags?: TagEntry[];
  summary?: string;
  message: string;
  extracted_data?: Record<string, unknown>;
  suggested_folder?: string;
  saved_file_id?: number;
};

export type FileItem = {
  id: string;
  filename: string;
  uploadedAt: string;
  analysisResult: AnalysisResult;
  confirmedTags?: string[];
  tags: string[];
  folder: string;
};

// Upload senza analisi
export type ManualUploadPayload = {
  filename: string;
  tags: string[];
  folder: string;
};

type FileState = {
  files: FileItem[];
  pendingAnalysis: AnalysisResult | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  errorCode: string | null;
};

const initialState: FileState = {
  files: [],
  pendingAnalysis: null,
  status: "idle",
  error: null,
  errorCode: null,
};

// ============================================================
// ERROR PARSING
// ============================================================

type ApiError = {
  message?: string;
  error?: string;
  code?: string;
  details?: unknown;
};

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const obj = payload as ApiError;
  return obj.message?.trim() || obj.error?.trim() || fallback;
}

function extractErrorCode(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  return (payload as ApiError).code ?? null;
}

// ============================================================
// THUNKS
// ============================================================

export const uploadAndAnalyze = createAsyncThunk<
  AnalysisResult,
  { file: File; customTags?: Array<{ name: string; description: string; category?: string }> },
  { rejectValue: { message: string; code: string | null } }
>("files/uploadAndAnalyze", async ({ file, customTags }, thunkApi) => {
  const formData = new FormData();
  formData.append("file", file);
  if (customTags && customTags.length > 0) {
    formData.append("custom_tags_for_analysis", JSON.stringify(customTags));
  }

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
    return thunkApi.rejectWithValue({
      message: text.trim() || "Risposta non valida dal server.",
      code: "PARSE_ERROR",
    });
  }

  if (!response.ok) {
    return thunkApi.rejectWithValue({
      message: extractErrorMessage(data, "Errore durante l'analisi del file."),
      code: extractErrorCode(data),
    });
  }

  return data as AnalysisResult;
});

export const confirmClassification = createAsyncThunk<
  AnalysisResult,
  { fileId: string; confirmedTags: string[]; additionalTags?: string[] },
  { rejectValue: { message: string; code: string | null } }
>("files/confirmClassification", async (payload, thunkApi) => {
  const response = await fetch("/api/classify/confirm", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_id: payload.fileId,
      confirmed_tags: payload.confirmedTags,
      additional_tags: payload.additionalTags ?? [],
    }),
  });

  const data = (await response.json()) as unknown;
  if (!response.ok) {
    return thunkApi.rejectWithValue({
      message: extractErrorMessage(data, "Errore durante la conferma."),
      code: extractErrorCode(data),
    });
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
    addManualFile(state, action: PayloadAction<ManualUploadPayload>) {
      const { filename, tags, folder } = action.payload;
      const fileItem: FileItem = {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        filename,
        uploadedAt: new Date().toISOString(),
        analysisResult: {
          type: "CLASSIFIED",
          file_id: "",
          filename,
          tags: tags.map((name) => ({ name, confidence: 1.0, category: "manual" })),
          assigned_tags: tags,
          message: "File salvato manualmente.",
          suggested_folder: folder,
        },
        tags,
        folder,
      };
      state.files.unshift(fileItem);
    },
    removeFile(state, action: PayloadAction<string>) {
      state.files = state.files.filter((f) => f.id !== action.payload);
    },
    updateFileTags(
      state,
      action: PayloadAction<{ fileId: string; tags: string[]; folder?: string }>
    ) {
      const { fileId, tags, folder } = action.payload;
      const file = state.files.find((f) => f.id === fileId);
      if (file) {
        file.tags = tags;
        if (folder) file.folder = folder;
      }
    },
    clearError(state) {
      state.error = null;
      state.errorCode = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // UPLOAD + ANALYZE
      .addCase(uploadAndAnalyze.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.errorCode = null;
        state.pendingAnalysis = null;
      })
      .addCase(uploadAndAnalyze.fulfilled, (state, action) => {
        state.status = "succeeded";
        const result = action.payload;

        if (
          result.type === "CONFIRMATION_REQUIRED" ||
          result.type === "PARTIAL_CONFIRMATION"
        ) {
          state.pendingAnalysis = result;
        } else {
          const fileItem: FileItem = {
            id: result.file_id || `${Date.now()}`,
            filename: result.filename,
            uploadedAt: new Date().toISOString(),
            analysisResult: result,
            tags: result.assigned_tags ?? [],
            folder: result.suggested_folder ?? "Altro",
          };
          state.files.unshift(fileItem);
        }
      })
      .addCase(uploadAndAnalyze.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message ?? "Errore sconosciuto.";
        state.errorCode = action.payload?.code ?? null;
      })

      // CONFIRM
      .addCase(confirmClassification.fulfilled, (state, action) => {
        const result = action.payload;
        state.pendingAnalysis = null;

        const fileItem: FileItem = {
          id: result.file_id || `${Date.now()}`,
          filename: result.filename,
          uploadedAt: new Date().toISOString(),
          analysisResult: result,
          confirmedTags: result.assigned_tags,
          tags: result.assigned_tags ?? [],
          folder: result.suggested_folder ?? "Altro",
        };
        state.files.unshift(fileItem);
      })
      .addCase(confirmClassification.rejected, (state, action) => {
        state.error = action.payload?.message ?? "Errore durante la conferma.";
        state.errorCode = action.payload?.code ?? null;
      });
  },
});

export const {
  clearPendingAnalysis,
  addManualFile,
  removeFile,
  updateFileTags,
  clearError,
} = fileSlice.actions;

export default fileSlice.reducer;
