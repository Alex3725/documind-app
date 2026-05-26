"use client";

import type React from "react";
import styled from "styled-components";
import type { FileItem } from "@/lib/features/fileSlice";

type FolderRowProps = {
  folderId: number;
  icon: string;
  name: string;
  count: number;
  color: string;
  dropTarget: boolean;
  onOpen?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onTrash?: () => void;
  onMove?: () => void;
  onCopy?: () => void;
};

export function ExplorerFolderRow({
  folderId,
  icon,
  name,
  count,
  color,
  dropTarget,
  onOpen,
  onDragOver,
  onDragLeave,
  onDrop,
  onTrash,
  onMove,
  onCopy,
}: FolderRowProps) {
  return (
    <FolderRow
      data-folder-id={folderId}
      $color={color}
      $dropTarget={dropTarget}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onOpen}
    >
      <FolderIcon>{icon}</FolderIcon>
      <FolderName>{name}</FolderName>
      <FolderCount>{count}</FolderCount>
      <FolderActions>
        {onMove && <ActionBtn type="button" onClick={(e) => { e.stopPropagation(); onMove(); }}>Sposta</ActionBtn>}
        {onCopy && <ActionBtn type="button" onClick={(e) => { e.stopPropagation(); onCopy(); }}>Copia</ActionBtn>}
        {onTrash && <DangerBtn type="button" onClick={(e) => { e.stopPropagation(); onTrash(); }}>Cestina</DangerBtn>}
      </FolderActions>
      {dropTarget && <DropHint>⬇ Sposta qui</DropHint>}
    </FolderRow>
  );
}

type FileRowProps = {
  file: FileItem;
  dragging: boolean;
  renaming: boolean;
  renameValue: string;
  onDragStart: (e: React.DragEvent, fileId: string) => void;
  onDragEnd: () => void;
  onRenameStart: (fileId: string, currentName: string) => void;
  onRenameValueChange: (value: string) => void;
  onRenameConfirm: (fileId: string) => void;
  onRenameCancel: () => void;
  onDelete: (fileId: string) => void;
  showTags?: boolean;
};

export function ExplorerFileRowItem({
  file,
  dragging,
  renaming,
  renameValue,
  onDragStart,
  onDragEnd,
  onRenameStart,
  onRenameValueChange,
  onRenameConfirm,
  onRenameCancel,
  onDelete,
  showTags = true,
}: FileRowProps) {
  return (
    <FileRow
      draggable
      onDragStart={(e) => onDragStart(e, file.id)}
      onDragEnd={onDragEnd}
      $dragging={dragging}
    >
      <FileIcon>📄</FileIcon>
      <FileName onDoubleClick={() => onRenameStart(file.id, file.filename)}>
        {renaming ? (
          <RenameInput
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.target.value)}
            onBlur={() => onRenameConfirm(file.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameConfirm(file.id);
              if (e.key === "Escape") onRenameCancel();
            }}
            autoFocus
          />
        ) : (
          file.filename
        )}
      </FileName>
      <FileTags>
        {showTags && file.tags.slice(0, 2).map((t) => <MiniTag key={t}>{t}</MiniTag>)}
      </FileTags>
      <FileStatus>
        {file.userOverride ? "👤" : file.analysisResult.type === "CLASSIFIED" ? "✅" : "🤔"}
      </FileStatus>
      <DeleteBtn onClick={() => onDelete(file.id)}>🗑️</DeleteBtn>
    </FileRow>
  );
}

const FolderRow = styled.div<{ $color: string; $dropTarget: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: ${({ $dropTarget }) => ($dropTarget ? "#f0faf5" : "#f9fdf9")};
  border-bottom: 1px solid #e5ede9;
  border: ${({ $dropTarget }) => ($dropTarget ? "2px dashed #1b6f5c" : "none")};
  position: relative;
  cursor: pointer;

  &:hover {
    background: #ecfdf5;
  }
`;

const FolderIcon = styled.span`
  font-size: 1.2rem;
`;

const FolderName = styled.span`
  font-weight: 700;
  font-size: 0.9rem;
  color: #1a3a30;
  flex: 1;
`;

const FolderCount = styled.span`
  font-size: 0.74rem;
  color: #888;
  background: #f0f0f0;
  border-radius: 999px;
  padding: 2px 8px;
`;

const FolderActions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const ActionBtn = styled.button`
  border: 1px solid #dbe4e0;
  background: #fff;
  color: #0f172a;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
`;

const DangerBtn = styled(ActionBtn)`
  border-color: rgba(239, 68, 68, 0.25);
  color: #b91c1c;
`;

const DropHint = styled.span`
  font-size: 0.74rem;
  font-weight: 700;
  color: #1b6f5c;
  margin-left: 8px;
`;

const FileRow = styled.div<{ $dragging: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px 9px 32px;
  border-bottom: 1px solid #f0f0f0;
  cursor: grab;
  background: ${({ $dragging }) => ($dragging ? "#f0faf5" : "transparent")};
  opacity: ${({ $dragging }) => ($dragging ? 0.5 : 1)};
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: #f9fdf9;
  }
`;

const FileIcon = styled.span`
  font-size: 0.9rem;
`;

const FileName = styled.div`
  flex: 1;
  font-size: 0.85rem;
  color: #1a3a30;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
`;

const FileTags = styled.div`
  display: flex;
  gap: 4px;
`;

const MiniTag = styled.span`
  font-size: 0.65rem;
  background: #f0faf5;
  color: #1b6f5c;
  border-radius: 999px;
  padding: 1px 6px;
`;

const FileStatus = styled.span`
  font-size: 0.85rem;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.3;
  font-size: 0.8rem;
  &:hover {
    opacity: 1;
  }
`;

const RenameInput = styled.input`
  border: 1px solid #1b6f5c;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.88rem;
  outline: none;
  width: 100%;
`;
