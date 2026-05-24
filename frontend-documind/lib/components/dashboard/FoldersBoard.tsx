"use client";

import styled from "styled-components";
import FileExplorer from "@/lib/components/FileExplorer";

type Props = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  currentFolderPath?: string;
  onOpenFolder: (fullPath: string) => void;
};

export default function FoldersBoard({
  searchTerm,
  onSearchTermChange,
  currentFolderPath,
  onOpenFolder,
}: Props) {
  const displayPath = currentFolderPath ? `main / workspace / ${currentFolderPath}` : "main / workspace / folders";

  return (
    <Board>
      <HeaderRow>
        <HeaderCopy>
          <HeaderLabel>Vista contenuti</HeaderLabel>
          <HeaderMeta>righe riusabili per file e cartelle</HeaderMeta>
        </HeaderCopy>
        <HeaderPath>{displayPath}</HeaderPath>
      </HeaderRow>
      <ExplorerWrap>
        <FileExplorer
          searchTerm={searchTerm}
          onSearchTermChange={onSearchTermChange}
          hideSearchInput={true}
          currentFolderPath={currentFolderPath}
          onOpenFolder={onOpenFolder}
        />
      </ExplorerWrap>
    </Board>
  );
}

const Board = styled.section`
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #dbe4e0;
  border-radius: 18px;
  padding: 14px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HeaderLabel = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 800;
`;

const HeaderMeta = styled.div`
  color: #64748b;
  font-size: 0.76rem;
`;

const HeaderPath = styled.div`
  color: #0f172a;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 6px 10px;
  border: 1px solid #dbe4e0;
  border-radius: 999px;
  background: #f8fafc;
`;

const ExplorerWrap = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px;
  min-height: 0;
  flex: 1;
`;
