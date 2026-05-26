"use client";

import { useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  copyFolder,
  moveFolder,
  trashFolder,
  moveFileToFolder,
  overrideFileFolder,
  removeFile,
  loadFolders,
} from "@/lib/features/fileSlice";
import ClassificationResult from "@/lib/components/ClassificationResult";
import { ExplorerFileRowItem, ExplorerFolderRow } from "@/lib/components/dashboard/ExplorerRows";

type ViewMode = "grid" | "list" | "explorer";

type Props = {
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  hideSearchInput?: boolean;
  currentFolderPath?: string;
  onOpenFolder?: (fullPath: string) => void;
};

export default function FileExplorer({
  searchTerm,
  onSearchTermChange,
  hideSearchInput = false,
  currentFolderPath,
  onOpenFolder,
}: Props) {
  const dispatch = useAppDispatch();
  const { files, folders } = useAppSelector((s) => s.files);

  const [viewMode, setViewMode] = useState<ViewMode>("explorer");
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [folderAction, setFolderAction] = useState<null | { mode: "move" | "copy"; folderId: number; folderName: string; sourcePath: string }>(null);
  const [targetParentPath, setTargetParentPath] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  // =====================================================
  // DRAG AND DROP
  // =====================================================

  const handleDragStart = useCallback((e: React.DragEvent, fileId: string) => {
    setDraggingFileId(fileId);
    e.dataTransfer.setData("text/plain", fileId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingFileId(null);
    setDragOverFolder(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolder(folderPath);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverFolder(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetFolderPath: string) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData("text/plain") || draggingFileId;
    if (!fileId) return;

    const targetFolder = folders.find((f) => f.fullPath === targetFolderPath);
    if (targetFolder) {
      dispatch(moveFileToFolder({ fileId, targetFolder }));
    } else {
      dispatch(overrideFileFolder({ fileId, folder: targetFolderPath }));
    }
    setDragOverFolder(null);
    setDraggingFileId(null);
  }, [dispatch, draggingFileId, folders]);

  // =====================================================
  // RENAME FILE (locale)
  // =====================================================

  const startRename = (fileId: string, currentName: string) => {
    setRenaming(fileId);
    setRenameValue(currentName);
  };

  const confirmRename = () => {
    // In produzione: chiamata API PATCH /api/v1/files/{id}
    // Qui aggiorna solo localmente per demo
    setRenaming(null);
    setRenameValue("");
  };

  // =====================================================
  // FILTER FILES
  // =====================================================

  const effectiveSearch = searchTerm ?? search;

  const filteredFiles = files.filter((f) => {
    if (activeFolder && f.folder !== activeFolder) return false;
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      return (
        f.filename.toLowerCase().includes(q) ||
        f.tags.some((t) => t.includes(q)) ||
        f.folder.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const normalizedCurrentFolderPath = (currentFolderPath ?? "").trim();

  const visibleFolders = folders
    .filter((f) => !f.system)
    .filter((f) => {
      if (!normalizedCurrentFolderPath) {
        return !f.parentPath;
      }
      return f.parentPath === normalizedCurrentFolderPath;
    })
    .sort((a, b) => a.fullPath.localeCompare(b.fullPath))
    .map((folder) => ({
      folder,
      files: filteredFiles.filter((f) => f.folder === folder.fullPath),
    }));

  const currentFolderFiles = normalizedCurrentFolderPath
    ? filteredFiles.filter((f) => f.folder === normalizedCurrentFolderPath)
    : [];

  const parentFolderPath = normalizedCurrentFolderPath
    ? folders.find((f) => f.fullPath === normalizedCurrentFolderPath)?.parentPath ?? ""
    : "";

  const uncategorized = filteredFiles.filter((f) => f.folder === "Non classificati" || !f.folder);

  const availableTargets = folders
    .filter((f) => !f.system && !f.trashed)
    .filter((f) => !folderAction || f.fullPath !== folderAction.sourcePath)
    .filter((f) => !folderAction || !f.fullPath.startsWith(`${folderAction.sourcePath}/`));

  const openFolderAction = (mode: "move" | "copy", folder: { id: number; name: string; fullPath: string }) => {
    setFolderAction({ mode, folderId: folder.id, folderName: folder.name, sourcePath: folder.fullPath });
    setTargetParentPath("");
    setNewFolderName(folder.name);
  };

  const confirmFolderAction = async () => {
    if (!folderAction) return;
    if (folderAction.mode === "move") {
      await dispatch(moveFolder({ folderId: folderAction.folderId, targetParentPath: targetParentPath || undefined, newName: newFolderName.trim() || undefined }));
    } else {
      await dispatch(copyFolder({ folderId: folderAction.folderId, targetParentPath: targetParentPath || undefined, newName: newFolderName.trim() || undefined }));
    }
    dispatch(loadFolders());
    setFolderAction(null);
  };

  const trashCurrentFolder = async (folderId: number) => {
    await dispatch(trashFolder(folderId));
    dispatch(loadFolders());
  };

  return (
    <ExplorerContainer>
      {/* TOOLBAR */}
      <Toolbar>
        {!hideSearchInput && (
          <SearchInput
            placeholder="🔍 Cerca file, tag, cartella..."
            value={effectiveSearch}
            onChange={(e) => {
              const value = e.target.value;
              if (onSearchTermChange) {
                onSearchTermChange(value);
              } else {
                setSearch(value);
              }
            }}
          />
        )}
        <ViewToggle>
          <ViewBtn $active={viewMode === "grid"} onClick={() => setViewMode("grid")} title="Griglia">⊞</ViewBtn>
          <ViewBtn $active={viewMode === "list"} onClick={() => setViewMode("list")} title="Lista">≡</ViewBtn>
          <ViewBtn $active={viewMode === "explorer"} onClick={() => setViewMode("explorer")} title="Explorer">🗂️</ViewBtn>
        </ViewToggle>
        {activeFolder && (
          <ClearFilter onClick={() => setActiveFolder(null)}>
            ✕ {activeFolder}
          </ClearFilter>
        )}
      </Toolbar>

      {viewMode !== "explorer" ? (
        /* VISTA GRIGLIA / LISTA */
        <>
          {/* ZONE DROP — mostra le cartelle come drop target */}
          <DropZonesRow>
            {folders
              .filter((f) => !f.system && f.depth === 0)
              .map((folder) => (
                <DropZone
                  key={folder.id}
                  $active={dragOverFolder === folder.fullPath}
                  $dragging={!!draggingFileId}
                  $selected={activeFolder === folder.fullPath}
                  onDragOver={(e) => handleDragOver(e, folder.fullPath)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.fullPath)}
                  onClick={() => setActiveFolder(activeFolder === folder.fullPath ? null : folder.fullPath)}
                >
                  <ZoneIcon $color={folder.color}>{folder.icon}</ZoneIcon>
                  <ZoneName>{folder.name}</ZoneName>
                  <ZoneCount>{files.filter((f) => f.folder === folder.fullPath).length}</ZoneCount>
                  {dragOverFolder === folder.fullPath && (
                    <DropIndicator>Sposta qui</DropIndicator>
                  )}
                </DropZone>
              ))}
          </DropZonesRow>

          {/* FILE CARDS */}
          {filteredFiles.length === 0 ? (
            <EmptyFiles>
              <span>📭</span>
              <p>{effectiveSearch ? `Nessun file trovato per "${effectiveSearch}"` : "Nessun file in questa cartella"}</p>
            </EmptyFiles>
          ) : viewMode === "grid" ? (
            <FilesGrid>
              {filteredFiles.map((file) => (
                <DraggableCard
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, file.id)}
                  onDragEnd={handleDragEnd}
                  $dragging={draggingFileId === file.id}
                >
                  <ClassificationResult file={file} />
                </DraggableCard>
              ))}
            </FilesGrid>
          ) : (
            <FilesList>
              {filteredFiles.map((file) => (
                <FileListRow
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, file.id)}
                  onDragEnd={handleDragEnd}
                  $dragging={draggingFileId === file.id}
                >
                  <FileListIcon>📄</FileListIcon>
                  <FileListInfo>
                    {renaming === file.id ? (
                      <RenameInput
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => confirmRename()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmRename();
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <FileListName
                        onDoubleClick={() => startRename(file.id, file.filename)}
                        title="Doppio clic per rinominare"
                      >
                        {file.filename}
                      </FileListName>
                    )}
                    <FileListMeta>
                      {file.folder} · {file.tags.slice(0, 3).join(", ")}
                    </FileListMeta>
                  </FileListInfo>
                  <FileListStatus $type={file.analysisResult.type}>
                    {file.userOverride ? "👤" : file.analysisResult.type === "CLASSIFIED" ? "✅" : "🤔"}
                  </FileListStatus>
                  <FileListActions>
                    <ListActionBtn onClick={() => dispatch(removeFile(file.id))}>🗑️</ListActionBtn>
                  </FileListActions>
                </FileListRow>
              ))}
            </FilesList>
          )}
        </>
      ) : (
        /* VISTA EXPLORER — struttura ad albero */
        <ExplorerView>
          {normalizedCurrentFolderPath && (
            <BackFolderBtn type="button" onClick={() => onOpenFolder?.(parentFolderPath)}>
              ← Torna alla cartella superiore
            </BackFolderBtn>
          )}

          {visibleFolders.length === 0 && currentFolderFiles.length === 0 && (
            <EmptyFiles>
              <span>📁</span>
              <p>Nessun contenuto in questa cartella.</p>
            </EmptyFiles>
          )}

          {currentFolderFiles.length > 0 && (
            <ExplorerGroup>
              <ExplorerFolderRow
                folderId={0}
                icon="📄"
                name="File in questa cartella"
                count={currentFolderFiles.length}
                color="#64748b"
                dropTarget={false}
              />
              <ExplorerFiles>
                {currentFolderFiles.map((file) => (
                  <ExplorerFileRowItem
                    key={file.id}
                    file={file}
                    dragging={draggingFileId === file.id}
                    renaming={renaming === file.id}
                    renameValue={renameValue}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onRenameStart={startRename}
                    onRenameValueChange={setRenameValue}
                    onRenameConfirm={confirmRename}
                    onRenameCancel={() => setRenaming(null)}
                    onDelete={(fileId) => dispatch(removeFile(fileId))}
                  />
                ))}
              </ExplorerFiles>
            </ExplorerGroup>
          )}

          {visibleFolders.map(({ folder, files: folderFiles }) => (
            <ExplorerGroup key={folder.id}>
              <ExplorerFolderRow
                folderId={folder.id}
                icon={folder.icon}
                name={folder.name}
                count={folderFiles.length}
                color={folder.color}
                dropTarget={dragOverFolder === folder.fullPath}
                onOpen={() => onOpenFolder?.(folder.fullPath)}
                onDragOver={(e) => handleDragOver(e, folder.fullPath)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.fullPath)}
                onMove={() => openFolderAction("move", folder)}
                onCopy={() => openFolderAction("copy", folder)}
                onTrash={() => trashCurrentFolder(folder.id)}
              />

              <ExplorerFiles>
                {folderFiles.length === 0 ? (
                  <ExplorerEmptyFolder>Cartella vuota</ExplorerEmptyFolder>
                ) : (
                  folderFiles.map((file) => (
                    <ExplorerFileRowItem
                      key={file.id}
                      file={file}
                      dragging={draggingFileId === file.id}
                      renaming={renaming === file.id}
                      renameValue={renameValue}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onRenameStart={startRename}
                      onRenameValueChange={setRenameValue}
                      onRenameConfirm={confirmRename}
                      onRenameCancel={() => setRenaming(null)}
                      onDelete={(fileId) => dispatch(removeFile(fileId))}
                    />
                  ))
                )}
              </ExplorerFiles>
            </ExplorerGroup>
          ))}

          {/* Non classificati */}
          {uncategorized.length > 0 && (
            <ExplorerGroup>
              <ExplorerFolderRow
                folderId={0}
                icon="🗂️"
                name="Non classificati"
                count={uncategorized.length}
                color="#9ca3af"
                dropTarget={false}
                onOpen={() => setActiveFolder("Non classificati")}
              />
              <ExplorerFiles>
                {uncategorized.map((file) => (
                  <ExplorerFileRowItem
                    key={file.id}
                    file={file}
                    dragging={draggingFileId === file.id}
                    renaming={false}
                    renameValue={renameValue}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onRenameStart={startRename}
                    onRenameValueChange={setRenameValue}
                    onRenameConfirm={confirmRename}
                    onRenameCancel={() => setRenaming(null)}
                    onDelete={(fileId) => dispatch(removeFile(fileId))}
                    showTags={false}
                  />
                ))}
              </ExplorerFiles>
            </ExplorerGroup>
          )}
        </ExplorerView>
      )}

      {folderAction && (
        <ModalOverlay onClick={() => setFolderAction(null)}>
          <ActionModal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{folderAction.mode === "move" ? "Sposta cartella" : "Copia cartella"}</ModalTitle>
            <Hint>Seleziona la cartella di destinazione. Vuoi spostare o copiare {folderAction.folderName}.</Hint>
            <Input
              placeholder="Nuovo nome opzionale"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <TargetsList>
              <TargetBtn type="button" onClick={() => setTargetParentPath("")} $active={targetParentPath === ""}>
                Root
              </TargetBtn>
              {availableTargets.map((folder) => (
                <TargetBtn
                  key={folder.id}
                  type="button"
                  onClick={() => setTargetParentPath(folder.fullPath)}
                  $active={targetParentPath === folder.fullPath}
                >
                  {folder.fullPath}
                </TargetBtn>
              ))}
            </TargetsList>
            <ActionsRow>
              <GhostBtn type="button" onClick={() => setFolderAction(null)}>Annulla</GhostBtn>
              <PrimaryBtn type="button" onClick={confirmFolderAction} disabled={folderAction.mode !== "copy" && folderAction.mode !== "move"}>Conferma</PrimaryBtn>
            </ActionsRow>
          </ActionModal>
        </ModalOverlay>
      )}
    </ExplorerContainer>
  );
}

// ============================================================
// STYLES
// ============================================================

const float = keyframes`0%{transform:translateY(0);}50%{transform:translateY(-3px);}100%{transform:translateY(0);}`;

const ExplorerContainer = styled.div`display:flex;flex-direction:column;gap:16px;`;

const Toolbar = styled.div`display:flex;align-items:center;gap:10px;flex-wrap:wrap;`;
const SearchInput = styled.input`flex:1;min-width:160px;border:1px solid #d0ddd9;border-radius:10px;padding:9px 14px;font-size:0.9rem;outline:none;background:#fff;&:focus{border-color:#1b6f5c;box-shadow:0 0 0 3px rgba(27,111,92,0.1);}`;
const ViewToggle = styled.div`display:flex;border:1px solid #d0ddd9;border-radius:10px;overflow:hidden;background:#fff;`;
const ViewBtn = styled.button<{ $active: boolean }>`padding:8px 12px;border:none;cursor:pointer;font-size:1rem;background:${({ $active }) => $active ? "#f0faf5" : "transparent"};color:${({ $active }) => $active ? "#1b6f5c" : "#888"};&:hover{background:#f5f5f5;}`;
const ClearFilter = styled.button`padding:7px 12px;border:1px solid #fcd34d;background:#fffbeb;color:#92400e;border-radius:999px;font-size:0.82rem;cursor:pointer;font-weight:600;&:hover{background:#fef3c7;}`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(248, 250, 252, 0.48);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
`;

const ActionModal = styled.div`
  width: min(92vw, 760px);
  max-height: 88vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 18px;
  border: 1px solid #dbe4e0;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
`;

const Hint = styled.div`
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.4;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dbe4e0;
  border-radius: 10px;
  font-size: 0.9rem;
  box-sizing: border-box;
`;

const TargetsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TargetBtn = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#2563eb" : "#dbe4e0")};
  background: ${({ $active }) => ($active ? "rgba(37, 99, 235, 0.08)" : "#fff")};
  color: #0f172a;
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const GhostBtn = styled.button`
  border: 1px solid #dbe4e0;
  background: #fff;
  color: #0f172a;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
`;

const PrimaryBtn = styled.button`
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 800;
  cursor: pointer;
`;

// DROP ZONES
const DropZonesRow = styled.div`display:flex;flex-wrap:wrap;gap:8px;`;
const DropZone = styled.div<{ $active: boolean; $dragging: boolean; $selected: boolean }>`
  position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;
  padding:12px 16px;border-radius:12px;cursor:pointer;min-width:90px;
  border:2px dashed ${({ $active, $selected }) => $active ? "#1b6f5c" : $selected ? "#1b6f5c" : "#e0e8e5"};
  background:${({ $active, $selected }) => $active ? "#f0faf5" : $selected ? "#e8f5f0" : "#fafafa"};
  transition:all 0.2s;
  ${({ $dragging }) => $dragging && "cursor: copy;"}
  &:hover{border-color:#1b6f5c;background:#f5fdf9;}
`;
const ZoneIcon = styled.span<{ $color: string }>`font-size:1.5rem;color:${({ $color }) => $color};`;
const ZoneName = styled.span`font-size:0.75rem;font-weight:700;color:#444;text-align:center;`;
const ZoneCount = styled.span`font-size:0.68rem;color:#888;background:#f0f0f0;border-radius:999px;padding:1px 6px;`;
const DropIndicator = styled.div`position:absolute;inset:0;background:rgba(27,111,92,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;color:#1b6f5c;`;

// GRID/LIST
const FilesGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;`;
const DraggableCard = styled.div<{ $dragging: boolean }>`cursor:grab;opacity:${({ $dragging }) => $dragging ? 0.5 : 1};transition:opacity 0.15s;${({ $dragging }) => $dragging && `animation: ${float} 0.5s ease infinite;`}&:active{cursor:grabbing;}`;
const FilesList = styled.div`display:flex;flex-direction:column;gap:4px;`;
const FileListRow = styled.div<{ $dragging: boolean }>`display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fff;border:1px solid #e5ede9;border-radius:10px;cursor:grab;opacity:${({ $dragging }) => $dragging ? 0.5 : 1};&:hover{border-color:#1b6f5c;background:#f9fdf9;}`;
const FileListIcon = styled.span`font-size:1.2rem;`;
const FileListInfo = styled.div`flex:1;min-width:0;`;
const FileListName = styled.div`font-weight:600;color:#1a3a30;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text;`;
const FileListMeta = styled.div`font-size:0.74rem;color:#888;margin-top:2px;`;
const FileListStatus = styled.span<{ $type: string }>`font-size:1rem;`;
const FileListActions = styled.div`display:flex;gap:4px;`;
const ListActionBtn = styled.button`background:none;border:none;cursor:pointer;font-size:0.85rem;opacity:0.5;&:hover{opacity:1;}`;
const RenameInput = styled.input`border:1px solid #1b6f5c;border-radius:6px;padding:2px 8px;font-size:0.88rem;outline:none;width:100%;`;

// EXPLORER VIEW
const ExplorerView = styled.div`display:flex;flex-direction:column;gap:12px;`;
const BackFolderBtn = styled.button`
  align-self: flex-start;
  border: 1px solid #d0ddd9;
  background: #ffffff;
  color: #1f2937;
  border-radius: 10px;
  padding: 7px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }
`;
const ExplorerGroup = styled.div`background:#fff;border:1px solid #e5ede9;border-radius:14px;overflow:hidden;`;
const ExplorerFiles = styled.div``;
const ExplorerEmptyFolder = styled.div`padding:10px 16px 10px 32px;color:#74807c;font-size:0.82rem;`;

const EmptyFiles = styled.div`text-align:center;padding:40px;background:#fff;border:1px dashed #d0ddd9;border-radius:14px;span{font-size:2rem;display:block;margin-bottom:8px;}p{color:#888;font-size:0.92rem;}`;
