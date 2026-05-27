"use client";

import styled from "styled-components";
import { ExplorerFileRowItem, ExplorerFolderRow } from "@/lib/components/dashboard/ExplorerRows";
import type { FileItem } from "@/lib/features/fileSlice";

type Props = {
  files: FileItem[];
  draggingFileId: string | null;
  renameValue: string;
  onDragStart: (e: React.DragEvent, fileId: string) => void;
  onDragEnd: () => void;
  onRenameStart: (fileId: string, currentName: string) => void;
  onRenameValueChange: (value: string) => void;
  onRenameConfirm: (fileId: string) => void;
  onRenameCancel: () => void;
  onDelete: (fileId: string) => void;
  onOpen?: () => void;
};

export default function UntaggedSection({
  files,
  draggingFileId,
  renameValue,
  onDragStart,
  onDragEnd,
  onRenameStart,
  onRenameValueChange,
  onRenameConfirm,
  onRenameCancel,
  onDelete,
  onOpen,
}: Props) {
  if (files.length === 0) return null;

  return (
    <ExplorerGroup>
      <ExplorerFolderRow
        folderId={0}
        icon="🗂️"
        name="Non classificati"
        count={files.length}
        color="#9ca3af"
        dropTarget={false}
        onOpen={onOpen}
      />
      <ExplorerFiles>
        {files.map((file) => (
          <ExplorerFileRowItem
            key={file.id}
            file={file}
            dragging={draggingFileId === file.id}
            renaming={false}
            renameValue={renameValue}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onRenameStart={onRenameStart}
            onRenameValueChange={onRenameValueChange}
            onRenameConfirm={onRenameConfirm}
            onRenameCancel={onRenameCancel}
            onDelete={onDelete}
            showTags={false}
          />
        ))}
      </ExplorerFiles>
    </ExplorerGroup>
  );
}

const ExplorerGroup = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #dbe4e0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const ExplorerFiles = styled.div`
  display: flex;
  flex-direction: column;
`;
