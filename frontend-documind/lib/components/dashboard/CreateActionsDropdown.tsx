"use client";

import { useRef, useState } from "react";
import styled from "styled-components";
import TagInput from "@/lib/components/TagInput";

type AddFolderPayload = {
  name: string;
  description: string;
  semanticRules: string;
  autoUpdateType: boolean;
  autoTags: string[];
};

type Props = {
  onAddFolder: (payload: AddFolderPayload) => Promise<boolean>;
  onAddType: () => void;
  onAddFile: (file: File, runAnalysis: boolean) => Promise<void>;
  foldersCount: number;
  existingTags?: string[];
};

export default function CreateActionsDropdown({
  onAddFolder,
  onAddType,
  onAddFile,
  existingTags = [],
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

  const selectedFolderTags = folderTags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const handleAddFolder = async () => {
    if (folderName.trim().length < 2 || busy !== "none") return;
    setBusy("folder");
    try {
      const normalizedName = folderName.trim();
      const semanticRules = folderDescription.trim();
      const autoTags = selectedFolderTags;

      const created = await onAddFolder({
        name: normalizedName,
        description: semanticRules,
        semanticRules,
        autoUpdateType: autoTags.length > 0,
        autoTags,
      });

      if (created) {
        setShowFolderModal(false);
        setFolderName("");
        setFolderDescription("");
        setFolderTags("");
        setIsOpen(false);
      }
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
            <ModalHeader>
              <ModalTitle>Nuova cartella</ModalTitle>
              <ModalSubtitle>Usa solo tag già esistenti nel workspace.</ModalSubtitle>
            </ModalHeader>
            <ModalBody>
              <Input
                placeholder="Nome cartella"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFolder();
                }}
                autoFocus
              />

              <TagField>
                <TagInput
                  selected={selectedFolderTags.map((name) => ({ name }))}
                  onChange={(tags) => setFolderTags(tags.map((tag) => tag.name).join(", "))}
                  tags={existingTags.map((name) => ({ name }))}
                  placeholder="#tag esistente"
                  allowFreeText={false}
                />
              </TagField>

              <Textarea
                placeholder="Descrizione semantica usata per trovare i file"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
              />
              <Hint>I tag vengono selezionati solo tra quelli già presenti nel workspace.</Hint>
            </ModalBody>
            <ModalActions>
              <GhostBtn type="button" onClick={() => setShowFolderModal(false)}>
                Annulla
              </GhostBtn>
              <PrimaryBtn type="button" onClick={handleAddFolder} disabled={folderName.trim().length < 2 || busy !== "none"}>
                {busy === "folder" ? "Salvataggio..." : "Salva"}
              </PrimaryBtn>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {showFileModal && (
        <ModalOverlay onClick={() => setShowFileModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Aggiungi file</ModalTitle>
              <ModalSubtitle>Stesso contenitore del popup cartella.</ModalSubtitle>
            </ModalHeader>
            <ModalBody>
              <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
              <Hint>Vuoi avviare l&apos;analisi AI su questo file?</Hint>
            </ModalBody>
            <ModalActions>
              <GhostBtn type="button" onClick={() => setShowFileModal(false)}>
                Annulla
              </GhostBtn>
              <PrimaryBtn type="button" onClick={() => handleAddFile(false)} disabled={!selectedFile || busy !== "none"}>
                Carica senza analisi
              </PrimaryBtn>
              <PrimaryBtn type="button" onClick={() => handleAddFile(true)} disabled={!selectedFile || busy !== "none"}>
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
  background: rgba(248, 250, 252, 0.52);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
  overflow-y: auto;
  cursor: pointer;

  @media (max-width: 640px) {
    padding: 10px;
    align-items: center;
  }
`;

const Modal = styled.div`
  background: white;
  border-radius: 14px;
  padding: 18px;
  width: min(92vw, 540px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
  cursor: default;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.05rem;
`;

const ModalSubtitle = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.4;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TagField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dbe4e0;
  border-radius: 10px;
  font-size: 0.9rem;
  box-sizing: border-box;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  resize: vertical;
  padding: 10px 12px;
  border: 1px solid #dbe4e0;
  border-radius: 10px;
  font-size: 0.9rem;
  box-sizing: border-box;
`;

const Hint = styled.div`
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.4;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`;

const GhostBtn = styled.button`
  padding: 9px 14px;
  border-radius: 9px;
  border: 1px solid #dbe4e0;
  background: #fff;
  color: #0f172a;
  font-weight: 700;
  cursor: pointer;
`;

const PrimaryBtn = styled.button`
  padding: 9px 14px;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;
