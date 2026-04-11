"use client";

import { useCallback, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { uploadAndAnalyze, clearError } from "@/lib/features/fileSlice";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
];
const ACCEPTED_EXT = [".pdf", ".docx", ".txt", ".md", ".csv", ".html"];
const MAX_SIZE_MB = 50;

export default function UploadZone() {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.files);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = status === "loading";

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File troppo grande (max ${MAX_SIZE_MB}MB)`;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXT.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
      return `Tipo non supportato. Accettati: ${ACCEPTED_EXT.join(", ")}`;
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        alert(validationError);
        return;
      }
      setSelectedFile(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (!selectedFile || isLoading) return;
    dispatch(clearError());
    await dispatch(uploadAndAnalyze({ file: selectedFile }));
    setSelectedFile(null);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    dispatch(clearError());
  };

  return (
    <Container>
      {!selectedFile ? (
        <DropZone
          $dragging={dragging}
          $disabled={isLoading}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isLoading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            style={{ display: "none" }}
            accept={ACCEPTED_EXT.join(",")}
            onChange={handleInputChange}
          />
          {isLoading ? (
            <>
              <SpinnerWrapper><Spinner /></SpinnerWrapper>
              <DropText>Analisi AI in corso...</DropText>
              <DropHint>Il documento viene classificato dal modello locale</DropHint>
            </>
          ) : (
            <>
              <DropIcon $dragging={dragging}>
                {dragging ? "📂" : "⬆️"}
              </DropIcon>
              <DropText>
                {dragging ? "Rilascia il file qui" : "Trascina un file o clicca per selezionarlo"}
              </DropText>
              <DropHint>PDF, DOCX, TXT, MD, CSV, HTML · max {MAX_SIZE_MB}MB</DropHint>
            </>
          )}
        </DropZone>
      ) : (
        <FilePreview>
          <FileIcon>{getFileIcon(selectedFile.name)}</FileIcon>
          <FileInfo>
            <FileName>{selectedFile.name}</FileName>
            <FileSize>{formatSize(selectedFile.size)}</FileSize>
          </FileInfo>
          <PreviewActions>
            <CancelBtn onClick={handleCancel}>✕</CancelBtn>
            <AnalyzeBtn onClick={handleAnalyze} disabled={isLoading}>
              🔍 Analizza
            </AnalyzeBtn>
          </PreviewActions>
        </FilePreview>
      )}

      {error && (
        <ErrorBanner>
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => dispatch(clearError())}>✕</button>
        </ErrorBanner>
      )}
    </Container>
  );
}

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "📕";
    case "docx": return "📘";
    case "txt": case "md": return "📄";
    case "csv": return "📊";
    case "html": return "🌐";
    default: return "📄";
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ===== STYLES =====

const Container = styled.div`display: flex; flex-direction: column; gap: 12px;`;

const DropZone = styled.div<{ $dragging: boolean; $disabled: boolean }>`
  border: 2px dashed ${({ $dragging }) => ($dragging ? "#1b6f5c" : "#c5d9d5")};
  border-radius: 16px;
  padding: 36px 24px;
  text-align: center;
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  background: ${({ $dragging }) => ($dragging ? "#f0faf5" : "#fafafa")};
  transition: all 0.2s ease;
  opacity: ${({ $disabled }) => ($disabled ? 0.85 : 1)};

  &:hover:not([data-disabled]) {
    border-color: #1b6f5c;
    background: #f5fdf9;
  }
`;

const DropIcon = styled.div<{ $dragging: boolean }>`
  font-size: 2.5rem;
  margin-bottom: 12px;
  transform: ${({ $dragging }) => ($dragging ? "scale(1.15)" : "scale(1)")};
  transition: transform 0.2s;
`;

const DropText = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: #1a3a30;
  margin: 0 0 6px;
`;

const DropHint = styled.p`
  font-size: 0.82rem;
  color: #888;
  margin: 0;
`;

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const SpinnerWrapper = styled.div`margin-bottom: 12px;`;
const Spinner = styled.div`
  width: 40px; height: 40px;
  border: 3px solid #d0ede6;
  border-top-color: #1b6f5c;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin: 0 auto;
`;

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f5faf8;
  border-radius: 14px;
  border: 1px solid #c8e6de;
`;

const FileIcon = styled.span`font-size: 2rem;`;

const FileInfo = styled.div`flex: 1; min-width: 0;`;

const FileName = styled.div`
  font-weight: 600;
  color: #1a3a30;
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`font-size: 0.78rem; color: #888;`;

const PreviewActions = styled.div`display: flex; gap: 8px; flex-shrink: 0;`;

const CancelBtn = styled.button`
  width: 32px; height: 32px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: #888;
  font-size: 0.8rem;

  &:hover { background: #fee; color: #c00; }
`;

const AnalyzeBtn = styled.button`
  padding: 8px 16px;
  background: linear-gradient(135deg, #1b6f5c 0%, #245c99 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #fff2f4;
  border: 1px solid #f0c2c6;
  border-radius: 10px;
  color: #a31a24;
  font-size: 0.88rem;

  span:first-child { flex-shrink: 0; }
  span:nth-child(2) { flex: 1; }

  button {
    background: none; border: none;
    cursor: pointer; color: #a31a24;
    font-size: 0.8rem;
    padding: 2px 4px;
  }
`;
