"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";

type AddFolderPayload = {
  name: string;
  description: string;
};

type Props = {
  foldersCount: number;
  onAddFolder: (payload: AddFolderPayload) => Promise<void>;
  onAddType: () => void;
  onAddFile: (file: File, runAnalysis: boolean) => Promise<void>;
};

export default function QuickActionsPanel({ foldersCount, onAddFolder, onAddType, onAddFile }: Props) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"none" | "folder" | "file">("none");

  const disableFolderSave = useMemo(() => {
    return folderName.trim().length < 2 || busy !== "none";
  }, [folderName, busy]);

  const handleSaveFolder = async () => {
    if (disableFolderSave) return;
    setBusy("folder");
    try {
      await onAddFolder({ name: folderName.trim(), description: folderDescription.trim() });
      setShowFolderModal(false);
      setFolderName("");
      setFolderDescription("");
    } finally {
      setBusy("none");
    }
  };

  const submitFile = async (runAnalysis: boolean) => {
    if (!selectedFile || busy !== "none") return;
    setBusy("file");
    try {
      await onAddFile(selectedFile, runAnalysis);
      setShowFileModal(false);
      setSelectedFile(null);
    } finally {
      setBusy("none");
    }
  };

  return (
    <Panel>
      <Title>Azioni rapide</Title>
      <Sub>{foldersCount} cartelle disponibili</Sub>

      <Actions>
        <MainBtn type="button" onClick={() => setShowFolderModal(true)}>+ Aggiungi cartella</MainBtn>
        <MainBtn type="button" onClick={onAddType}>+ Aggiungi tipo</MainBtn>
        <MainBtn type="button" onClick={() => setShowFileModal(true)}>+ Aggiungi file</MainBtn>
      </Actions>

      {showFolderModal && (
        <ModalOverlay>
          <Modal>
            <ModalTitle>Nuova cartella</ModalTitle>
            <Input
              placeholder="Nome cartella"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
            <Textarea
              placeholder="Descrizione semantica"
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
            />
            <ModalActions>
              <GhostBtn type="button" onClick={() => setShowFolderModal(false)}>Annulla</GhostBtn>
              <PrimaryBtn type="button" onClick={handleSaveFolder} disabled={disableFolderSave}>
                {busy === "folder" ? "Salvataggio..." : "Salva"}
              </PrimaryBtn>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {showFileModal && (
        <ModalOverlay>
          <Modal>
            <ModalTitle>Aggiungi file</ModalTitle>
            <Input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            <Hint>Vuoi avviare l&apos;analisi AI su questo file?</Hint>
            <ModalActions>
              <GhostBtn type="button" onClick={() => setShowFileModal(false)}>Annulla</GhostBtn>
              <PrimaryBtn
                type="button"
                onClick={() => submitFile(false)}
                disabled={!selectedFile || busy !== "none"}
              >
                Carica senza analisi
              </PrimaryBtn>
              <PrimaryBtn
                type="button"
                onClick={() => submitFile(true)}
                disabled={!selectedFile || busy !== "none"}
              >
                Analizza e carica
              </PrimaryBtn>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </Panel>
  );
}

const Panel = styled.section`
  background: #1e88e5;
  border: 1px solid #1976d2;
  border-radius: 16px;
  padding: 14px;
  color: #eff6ff;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 240px;
`;

const Title = styled.h3`margin:0;font-size:0.96rem;font-weight:800;`;
const Sub = styled.div`font-size:0.78rem;opacity:0.95;`;
const Actions = styled.div`display:flex;flex-direction:column;gap:8px;`;

const MainBtn = styled.button`
  border: 1px solid #93c5fd;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 0.86rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  display: grid;
  place-items: center;
  z-index: 1200;
`;

const Modal = styled.div`
  width: min(92vw, 460px);
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ModalTitle = styled.h4`margin:0;color:#111827;font-size:1rem;`;
const Input = styled.input`border:1px solid #d1d5db;border-radius:10px;padding:10px;font-size:0.9rem;`;
const Textarea = styled.textarea`border:1px solid #d1d5db;border-radius:10px;padding:10px;font-size:0.9rem;min-height:84px;resize:vertical;`;
const Hint = styled.div`font-size:0.84rem;color:#374151;`;

const ModalActions = styled.div`display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;`;

const GhostBtn = styled.button`
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
`;

const PrimaryBtn = styled.button`
  border: none;
  background: #1f2937;
  color: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
