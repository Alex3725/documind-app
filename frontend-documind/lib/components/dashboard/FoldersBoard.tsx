"use client";

import styled from "styled-components";
import FileExplorer from "@/lib/components/FileExplorer";

type Props = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
};

export default function FoldersBoard({ searchTerm, onSearchTermChange }: Props) {
  return (
    <Board>
      <Header>Cartelle</Header>
      <ExplorerWrap>
        <FileExplorer
          searchTerm={searchTerm}
          onSearchTermChange={onSearchTermChange}
          hideSearchInput={true}
        />
      </ExplorerWrap>
    </Board>
  );
}

const Board = styled.section`
  background: #ff3344;
  border: 1px solid #ef4444;
  border-radius: 16px;
  padding: 14px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Header = styled.h3`
  margin: 0;
  color: #fff;
  font-size: 0.96rem;
  font-weight: 800;
`;

const ExplorerWrap = styled.div`
  background: rgba(255, 255, 255, 0.94);
  border-radius: 12px;
  padding: 10px;
  min-height: 0;
  flex: 1;
`;
