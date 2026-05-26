"use client";

import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { loadFolders, loadTrashedFolders, restoreFolder } from "@/lib/features/fileSlice";

type Props = {
  onBackToWorkspace: () => void;
};

export default function TrashBoard({ onBackToWorkspace }: Props) {
  const dispatch = useAppDispatch();
  const { trashedFolders } = useAppSelector((s) => s.files);

  const handleRestore = async (folderId: number) => {
    const result = await dispatch(restoreFolder(folderId));
    if (!restoreFolder.rejected.match(result)) {
      dispatch(loadFolders());
      dispatch(loadTrashedFolders());
    }
  };

  return (
    <Board>
      <Header>
        <HeaderCopy>
          <HeaderLabel>Cestino cartelle</HeaderLabel>
          <HeaderMeta>Le cartelle eliminate restano qui e possono essere ripristinate.</HeaderMeta>
        </HeaderCopy>
        <BackBtn type="button" onClick={onBackToWorkspace}>
          Torna al workspace
        </BackBtn>
      </Header>

      <List>
        {trashedFolders.length === 0 ? (
          <EmptyState>Nessuna cartella nel cestino.</EmptyState>
        ) : (
          trashedFolders.map((folder) => (
            <TrashRow key={folder.id}>
              <TrashInfo>
                <TrashName>{folder.name}</TrashName>
                <TrashPath>{folder.fullPath}</TrashPath>
              </TrashInfo>
              <TrashActions>
                <RestoreBtn type="button" onClick={() => handleRestore(folder.id)}>
                  Ripristina
                </RestoreBtn>
              </TrashActions>
            </TrashRow>
          ))
        )}
      </List>
    </Board>
  );
}

const Board = styled.section`
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #dbe4e0;
  border-radius: 18px;
  padding: 16px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const HeaderLabel = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 0.96rem;
  font-weight: 800;
`;

const HeaderMeta = styled.div`
  color: #64748b;
  font-size: 0.78rem;
`;

const BackBtn = styled.button`
  border: 1px solid #dbe4e0;
  background: #f8fafc;
  color: #0f172a;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TrashRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
`;

const TrashInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const TrashName = styled.div`
  font-weight: 800;
  color: #0f172a;
`;

const TrashPath = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  word-break: break-word;
`;

const TrashActions = styled.div`
  display: flex;
  gap: 8px;
`;

const RestoreBtn = styled.button`
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
`;

const EmptyState = styled.div`
  padding: 18px;
  text-align: center;
  color: #64748b;
  font-size: 0.86rem;
`;
