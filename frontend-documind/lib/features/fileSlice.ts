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

/** Punteggi di un livello di classificazione gerarchica */
export type ClassificationLevel = {
  scores: Record<string, number>;
  top: string | null;
  reasoning?: string;
};

/** Classificazione gerarchica completa a 3 livelli */
export type HierarchicalClassification = {
  step1_context: ClassificationLevel;
  step2_content_type: ClassificationLevel;
  step3_sub_type: ClassificationLevel;
};

export type AnalysisResult = {
  type: "CLASSIFIED" | "PARTIAL_CONFIRMATION" | "CONFIRMATION_REQUIRED" | "LOW_CONFIDENCE";
  file_id: string;
  filename: string;
  /** Tag assegnati automaticamente (confidence >= 0.75) */
  tags: TagEntry[];
  /** Nomi dei tag assegnati */
  assigned_tags: string[];
  /** Tag in attesa di conferma */
  pending_tags?: TagEntry[];
  /** Tutti i tag con score > 0.20 */
  all_tags?: TagEntry[];
  /** Classificazione gerarchica a 3 livelli */
  hierarchical_classification?: HierarchicalClassification;
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
  path?: string;
  analysisResult: AnalysisResult;
  confirmedTags?: string[];
  tags: string[];
  folder: string;
  /** Se l'utente ha sovrascritto manualmente la classificazione AI */
  userOverride?: boolean;
  /** Tipo sovrascritto dall'utente */
  overrideFolder?: string;
};

/** Cartella semantica */
export type FolderType = {
  id: number;
  name: string;
  fullPath: string;
  parentPath?: string;
  description?: string;
  semanticRules?: string;
  icon: string;
  color: string;
  autoTags?: string[];
  autoUpdateType: boolean;
  system: boolean;
  trashed?: boolean;
  trashedAt?: string;
  fileCount: number;
  depth: number;
  createdAt?: string;
};

type FileState = {
  files: FileItem[];
  pendingAnalysis: AnalysisResult | null;
  folders: FolderType[];
  trashedFolders: FolderType[];
  foldersLoaded: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  foldersStatus: "idle" | "loading" | "succeeded" | "failed";
  trashedFoldersStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  errorCode: string | null;
};

const initialState: FileState = {
  files: [],
  pendingAnalysis: null,
  folders: [],
  trashedFolders: [],
  foldersLoaded: false,
  status: "idle",
  foldersStatus: "idle",
  trashedFoldersStatus: "idle",
  error: null,
  errorCode: null,
};

// ============================================================
// ERROR PARSING
// ============================================================

type ApiError = { message?: string; error?: string; code?: string };

function extractMsg(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const obj = payload as ApiError;
  return obj.message?.trim() || obj.error?.trim() || fallback;
}

function extractCode(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  return (payload as ApiError).code ?? null;
}

// ============================================================
// THUNKS
// ============================================================

export const uploadAndAnalyze = createAsyncThunk<
  AnalysisResult,
  { file: File; customTags?: Record<string, string> },
  { rejectValue: { message: string; code: string | null } }
>("files/uploadAndAnalyze", async ({ file, customTags }, thunkApi) => {
  const formData = new FormData();
  formData.append("file", file);
  if (customTags && Object.keys(customTags).length > 0) {
    formData.append("custom_tags_for_analysis", JSON.stringify(customTags));
  }

  const response = await fetch("/api/classify/analyze", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const text = await response.text();
  let data: unknown = null;
  try { data = JSON.parse(text); } catch {
    return thunkApi.rejectWithValue({ message: text.trim() || "Risposta non valida.", code: "PARSE_ERROR" });
  }

  if (!response.ok) {
    return thunkApi.rejectWithValue({
      message: extractMsg(data, "Errore durante l'analisi del file."),
      code: extractCode(data),
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
      message: extractMsg(data, "Errore durante la conferma."),
      code: extractCode(data),
    });
  }
  return data as AnalysisResult;
});

export const reorderFiles = createAsyncThunk<
  { status: string; results: Array<{ fileId: string; assignedTag: string; oldPath: string; newPath: string; action: string }> },
  { files: Array<{ fileId: string; newTag: string; currentPath: string }> },
  { rejectValue: { message: string; code: string | null } }
>("files/reorderFiles", async (payload, thunkApi) => {
  const response = await fetch("/api/files/reorder", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = JSON.parse(text);
  } catch {
    return thunkApi.rejectWithValue({ message: text.trim() || "Risposta non valida.", code: "PARSE_ERROR" });
  }

  if (!response.ok) {
    return thunkApi.rejectWithValue({
      message: extractMsg(data, "Errore durante il riordino del file."),
      code: extractCode(data),
    });
  }

  return data as { status: string; results: Array<{ fileId: string; assignedTag: string; oldPath: string; newPath: string; action: string }> };
});

export const loadFolders = createAsyncThunk<
  FolderType[],
  void,
  { rejectValue: string }
>("files/loadFolders", async (_, thunkApi) => {
  const response = await fetch("/api/folders", {
    credentials: "include",
  });
  if (!response.ok) return thunkApi.rejectWithValue("Errore caricamento cartelle.");
  return (await response.json()) as FolderType[];
});

export const loadTrashedFolders = createAsyncThunk<
  FolderType[],
  void,
  { rejectValue: string }
>("files/loadTrashedFolders", async (_, thunkApi) => {
  const response = await fetch("/api/folders/trash", {
    credentials: "include",
  });
  if (!response.ok) return thunkApi.rejectWithValue("Errore caricamento cestino.");
  return (await response.json()) as FolderType[];
});

export const createFolder = createAsyncThunk<
  FolderType,
  {
    name: string;
    fullPath?: string;
    parentPath?: string;
    description: string;
    semanticRules?: string;
    icon?: string;
    color?: string;
    autoTags?: string[];
    autoUpdateType?: boolean;
  },
  { rejectValue: string }
>("files/createFolder", async (data, thunkApi) => {
  const response = await fetch("/api/folders", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) return thunkApi.rejectWithValue("Errore creazione cartella.");
  return (await response.json()) as FolderType;
});

export const seedFolderProfile = createAsyncThunk<
  FolderType[],
  string,
  { rejectValue: string }
>("files/seedProfile", async (profileName, thunkApi) => {
  const response = await fetch(`/api/folders/seed/${profileName}`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) return thunkApi.rejectWithValue("Errore seeding profilo.");
  return (await response.json()) as FolderType[];
});

export const trashFolder = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>("files/trashFolder", async (folderId, thunkApi) => {
  const response = await fetch(`/api/folders/${folderId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok && response.status !== 204) return thunkApi.rejectWithValue("Errore cestinamento cartella.");
});

export const restoreFolder = createAsyncThunk<
  FolderType,
  number,
  { rejectValue: string }
>("files/restoreFolder", async (folderId, thunkApi) => {
  const response = await fetch(`/api/folders/${folderId}/restore`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!response.ok) return thunkApi.rejectWithValue("Errore ripristino cartella.");
  return (await response.json()) as FolderType;
});

export const moveFolder = createAsyncThunk<
  FolderType,
  { folderId: number; targetParentPath?: string; newName?: string },
  { rejectValue: string }
>("files/moveFolder", async (payload, thunkApi) => {
  const response = await fetch(`/api/folders/${payload.folderId}/move`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetParentPath: payload.targetParentPath, newName: payload.newName }),
  });
  if (!response.ok) return thunkApi.rejectWithValue("Errore spostamento cartella.");
  return (await response.json()) as FolderType;
});

export const copyFolder = createAsyncThunk<
  FolderType,
  { folderId: number; targetParentPath?: string; newName?: string },
  { rejectValue: string }
>("files/copyFolder", async (payload, thunkApi) => {
  const response = await fetch(`/api/folders/${payload.folderId}/copy`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetParentPath: payload.targetParentPath, newName: payload.newName }),
  });
  if (!response.ok) return thunkApi.rejectWithValue("Errore copia cartella.");
  return (await response.json()) as FolderType;
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
    removeFile(state, action: PayloadAction<string>) {
      state.files = state.files.filter((f) => f.id !== action.payload);
    },
    updateFileTags(state, action: PayloadAction<{ fileId: string; tags: string[]; folder?: string }>) {
      const { fileId, tags, folder } = action.payload;
      const file = state.files.find((f) => f.id === fileId);
      if (file) {
        file.tags = tags;
        if (folder) file.folder = folder;
        file.userOverride = true;
        file.overrideFolder = folder;
      }
    },
    updateFileLocation(state, action: PayloadAction<{ fileId: string; folder: string; path?: string; tags?: string[] }>) {
      const { fileId, folder, path, tags } = action.payload;
      const file = state.files.find((f) => f.id === fileId);
      if (file) {
        file.folder = folder;
        if (path) file.path = path;
        if (tags) file.tags = tags;
      }
    },
    /** Sovrascrive manualmente la cartella/tipo di un file */
    overrideFileFolder(state, action: PayloadAction<{ fileId: string; folder: string; tags?: string[] }>) {
      const { fileId, folder, tags } = action.payload;
      const file = state.files.find((f) => f.id === fileId);
      if (file) {
        file.folder = folder;
        file.userOverride = true;
        file.overrideFolder = folder;
        if (tags) file.tags = tags;
      }
    },
    /** Quando un file viene spostato in una cartella, aggiorna tipo automaticamente */
    moveFileToFolder(state, action: PayloadAction<{ fileId: string; targetFolder: FolderType }>) {
      const { fileId, targetFolder } = action.payload;
      const file = state.files.find((f) => f.id === fileId);
      if (file) {
        file.folder = targetFolder.fullPath;
        file.userOverride = true;
        file.overrideFolder = targetFolder.fullPath;
        // Aggiunge auto-tag della cartella
        if (targetFolder.autoTags && targetFolder.autoUpdateType) {
          const currentTags = new Set(file.tags);
          targetFolder.autoTags.forEach((t) => currentTags.add(t));
          file.tags = Array.from(currentTags);
        }
      }
    },
    clearError(state) {
      state.error = null;
      state.errorCode = null;
    },
    updateFolder(state, action: PayloadAction<FolderType>) {
      const idx = state.folders.findIndex((f) => f.id === action.payload.id);
      if (idx >= 0) state.folders[idx] = action.payload;
    },
    removeFolder(state, action: PayloadAction<number>) {
      state.folders = state.folders.filter((f) => f.id !== action.payload);
    },
    addFileWithoutAnalysis(
      state,
      action: PayloadAction<{ filename: string; folder?: string; tags?: string[] }>
    ) {
      const filename = action.payload.filename.trim();
      if (!filename) return;

      const fallbackFolder = action.payload.folder?.trim() || "Non classificati";
      const tags = action.payload.tags ?? [];

      const manualResult: AnalysisResult = {
        type: "LOW_CONFIDENCE",
        file_id: `manual-${Date.now()}`,
        filename,
        tags: tags.map((name) => ({ name, confidence: 1 })),
        assigned_tags: tags,
        message: "Caricato senza analisi AI.",
        suggested_folder: fallbackFolder,
      };

      state.files.unshift({
        id: manualResult.file_id,
        filename,
        uploadedAt: new Date().toISOString(),
        analysisResult: manualResult,
        tags,
        folder: fallbackFolder,
        userOverride: true,
        overrideFolder: fallbackFolder,
      });
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

        if (result.type === "CONFIRMATION_REQUIRED" || result.type === "PARTIAL_CONFIRMATION") {
          state.pendingAnalysis = result;
        } else {
          const fileItem: FileItem = {
            id: result.file_id || `${Date.now()}`,
            filename: result.filename,
            uploadedAt: new Date().toISOString(),
            analysisResult: result,
            tags: result.assigned_tags ?? [],
            folder: result.suggested_folder ?? "Non classificati",
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
          folder: result.suggested_folder ?? "Non classificati",
        };
        state.files.unshift(fileItem);
      })
      .addCase(confirmClassification.rejected, (state, action) => {
        state.error = action.payload?.message ?? "Errore durante la conferma.";
        state.errorCode = action.payload?.code ?? null;
      })

      .addCase(reorderFiles.fulfilled, (state, action) => {
        for (const result of action.payload.results) {
          const file = state.files.find((entry) => entry.id === result.fileId);
          if (!file) continue;
          const nextTags = Array.from(new Set([...(file.tags ?? []), result.assignedTag].filter(Boolean)));
          file.tags = nextTags;
          file.path = result.newPath;
          const segments = result.newPath.split("/").filter(Boolean);
          file.folder = segments.length > 1 ? segments.slice(0, -1).join("/") : result.assignedTag;
        }
      })
      .addCase(reorderFiles.rejected, (state, action) => {
        state.error = action.payload?.message ?? "Errore durante il riordino.";
        state.errorCode = action.payload?.code ?? null;
      })

      // FOLDERS
      .addCase(loadFolders.pending, (state) => { state.foldersStatus = "loading"; })
      .addCase(loadFolders.fulfilled, (state, action) => {
        state.folders = action.payload;
        state.foldersLoaded = true;
        state.foldersStatus = "succeeded";
      })
      .addCase(loadFolders.rejected, (state) => { state.foldersStatus = "failed"; })
      .addCase(loadTrashedFolders.pending, (state) => { state.trashedFoldersStatus = "loading"; })
      .addCase(loadTrashedFolders.fulfilled, (state, action) => {
        state.trashedFolders = action.payload;
        state.trashedFoldersStatus = "succeeded";
      })
      .addCase(loadTrashedFolders.rejected, (state) => { state.trashedFoldersStatus = "failed"; })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.folders.push(action.payload);
        state.folders.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
      })
      .addCase(seedFolderProfile.fulfilled, (state, action) => {
        const newFolders = action.payload;
        const existingIds = new Set(state.folders.map((f) => f.id));
        const toAdd = newFolders.filter((f) => !existingIds.has(f.id));
        state.folders = [...state.folders, ...toAdd].sort((a, b) => a.fullPath.localeCompare(b.fullPath));
        state.foldersLoaded = true;
      });
  },
});

export const {
  clearPendingAnalysis,
  removeFile,
  updateFileTags,
  updateFileLocation,
  overrideFileFolder,
  moveFileToFolder,
  clearError,
  updateFolder,
  removeFolder,
  addFileWithoutAnalysis,
} = fileSlice.actions;

export default fileSlice.reducer;
