"use client";

import { useRef, useState } from "react";
import styled from "styled-components";

type AddFolderPayload = {
  name: string;
  description: string;
  semanticRules: string;
  autoUpdateType: boolean;
  autoTags: string[];
};

type Props = {
  onAddFolder: (payload: AddFolderPayload) => Promise<void>;
  onAddType: () => void;
  onAddFile: (file: File, runAnalysis: boolean) => Promise<void>;
  foldersCount: number;
};

export default function CreateActionsDropdown({
  onAddFolder,
  onAddType,
  onAddFile,
  foldersCount,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [folderTags, setFolderTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"none" | "folder" | "file">("none");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleAddFolder = async () => {
    if (folderName.trim().length < 2 || busy !== "none") return;
    setBusy("folder");
    try {
      const normalizedName = folderName.trim();
      const semanticRules = folderDescription.trim();
      const autoTags = folderTags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);

      await onAddFolder({
        name: normalizedName,
        description: semanticRules,
        semanticRules,
        autoUpdateType: autoTags.length > 0,
        autoTags,
      });
      setShowFolderModal(false);
      setFolderName("");
      setFolderDescription("");
      setFolderTags("");
      setIsOpen(false);
    } finally {
      setBusy("none");
    }
  };

  const handleAddFile = async (runAnalysis: boolean) => {
    if (!selectedFile || busy !== "none") return;
    setBusy("file");
    try {
      await onAddFile(selectedFile, runAnalysis);
      setShowFileModal(false);
      setSelectedFile(null);
      setIsOpen(false);
    } finally {
      setBusy("none");
    }
  };

  const handleTypeClick = () => {
    onAddType();
    setIsOpen(false);
  };

  return (
    <Container ref={dropdownRef}>
      <CreateBtn type="button" onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
        + Crea
      </CreateBtn>

      {isOpen && (
        <Dropdown>
          <MenuItem
            type="button"
            onClick={() => {
              setShowFolderModal(true);
              setIsOpen(false);
            }}
          >
            Nuova cartella
          </MenuItem>
          <MenuItem type="button" onClick={handleTypeClick}>
            Nuovo tipo
          </MenuItem>
          <MenuItem
            type="button"
            onClick={() => {
              setShowFileModal(true);
              setIsOpen(false);
            }}
          >
            Nuovo file
          </MenuItem>
        </Dropdown>
      )}

      {showFolderModal && (
        <ModalOverlay onClick={() => setShowFolderModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Nuova cartella</ModalTitle>
            <Input
              placeholder="Nome cartella"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddFolder();
              }}
              autoFocus
            />
            <Input
              placeholder="Tag cartella, separati da virgola"
              value={folderTags}
              onChange={(e) => setFolderTags(e.target.value)}
            />
            <Textarea
              placeholder="Descrizione semantica usata per trovare i file"
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
            />
            <Hint>
              Nessun tag viene creato in automatico. Puoi inserire anche piu tag per cartella, ad esempio: lavoro, svago, poesia.
            </Hint>
            <ModalActions>
              <GhostBtn type="button" onClick={() => setShowFolderModal(false)}>
                Annulla
              </GhostBtn>
              <PrimaryBtn
                type="button"
                onClick={handleAddFolder}
                disabled={folderName.trim().length < 2 || busy !== "none"}
              >
                {busy === "folder" ? "Salvataggio..." : "Salva"}
              </PrimaryBtn>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {showFileModal && (
        <ModalOverlay onClick={() => setShowFileModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Aggiungi file</ModalTitle>
            <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
            <Hint>Vuoi avviare l&apos;analisi AI su questo file?</Hint>
            <ModalActions>
              <GhostBtn type="button" onClick={() => setShowFileModal(false)}>
                Annulla
              </GhostBtn>
              <PrimaryBtn
                type="button"
                onClick={() => handleAddFile(false)}
                disabled={!selectedFile || busy !== "none"}
              >
                Carica senza analisi
              </PrimaryBtn>
              <PrimaryBtn
                type="button"
                onClick={() => handleAddFile(true)}
                disabled={!selectedFile || busy !== "none"}
              >
                Analizza e carica
              </PrimaryBtn>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  display: inline-block;
  margin-left: auto;
`;

const CreateBtn = styled.button<{ $isOpen?: boolean }>`
  padding: 11px 18px;
  border-radius: 10px;
  border: none;
  background: ${({ $isOpen }) => ($isOpen ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)")};
  color: white;
  font-weight: 900;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
  letter-spacing: 0.3px;

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.45);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 640px) {
    padding: 9px 12px;
    font-size: 0.85rem;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #dbe4e0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 160px;
  margin-top: 6px;
  overflow: hidden;

  @media (max-width: 640px) {
    position: fixed;
    right: 8px;
    left: 8px;
    width: auto;
    min-width: auto;
    margin-top: 0;
  }
`;

const MenuItem = styled.button`
  display: block;
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  background: none;
  border: none;
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(96, 165, 250, 0.08);
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f0f1f3;
  }

  @media (max-width: 640px) {
    padding: 12px 14px;
    font-size: 0.88rem;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;

  @media (max-width: 640px) {
    padding: 8px;
    align-items: flex-end;
  }
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  max-width: 420px;
  width: 90%;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  @media (max-width: 640px) {
    width: calc(100% - 16px);
    max-width: none;
    padding: 14px;
    border-radius: 16px 16px 0 0;
    max-height: calc(100vh - 80px);
    margin: 0 8px;
  }
`;

const ModalTitle = styled.h2`
  margin: 0 0 16px 0;
  font-size: 1.04rem;
  font-weight: 800;
  color: #0f172a;

  @media (max-width: 640px) {
    font-size: 0.96rem;
    margin-bottom: 12px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dbe4e0;
  border-radius: 8px;
  font-size: 0.88rem;
  margin-bottom: 12px;
  color: #0f172a;
  box-sizing: border-box;

  &::placeholder {
    color: #94a3b8;
  }

  @media (max-width: 640px) {
    padding: 10px 10px;
    font-size: 0.86rem;
    margin-bottom: 10px;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dbe4e0;
  border-radius: 8px;
  font-size: 0.88rem;
  margin-bottom: 12px;
  color: #0f172a;
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
  font-family: inherit;

  &::placeholder {
    color: #94a3b8;
  }

  @media (max-width: 640px) {
    padding: 10px 10px;
    font-size: 0.86rem;
    min-height: 70px;
    margin-bottom: 10px;
  }
`;

const Hint = styled.div`
  font-size: 0.76rem;
  color: #64748b;
  line-height: 1.4;
  margin-bottom: 12px;

  @media (max-width: 640px) {
    font-size: 0.72rem;
    margin-bottom: 10px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    gap: 6px;
  }
`;

const GhostBtn = styled.button`
  padding: 8px 12px;
  border: 1px solid #dbe4e0;
  background: transparent;
  color: #0f172a;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #f8fafc;
  }

  @media (max-width: 640px) {
    flex: 1;
    padding: 10px 8px;
    font-size: 0.78rem;
  }
`;

const PrimaryBtn = styled.button`
  padding: 8px 12px;
  border: none;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #54a3f5 0%, #2d6edd 100%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    flex: 1;
    padding: 10px 8px;
    font-size: 0.78rem;
  }
`;
