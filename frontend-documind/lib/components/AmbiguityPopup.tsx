"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";

export type CandidateTag = {
  name: string;
  description?: string;
};

type Props = {
  title?: string;
  candidates: CandidateTag[];
  onConfirm: (tag: CandidateTag) => void;
  onCancel: () => void;
};

export default function AmbiguityPopup({
  title = "Seleziona il tag corretto",
  candidates,
  onConfirm,
  onCancel,
}: Props) {
  const initialSelected = useMemo(() => candidates[0] ?? null, [candidates]);
  const [selected, setSelected] = useState<CandidateTag | null>(initialSelected);

  return (
    <Overlay>
      <Dialog role="dialog" aria-modal="true" aria-labelledby="ambiguity-title">
        <Header>
          <Title id="ambiguity-title">{title}</Title>
          <Subtitle>La ricerca ha restituito piu di un tag compatibile. Scegline uno per continuare.</Subtitle>
        </Header>

        <List>
          {candidates.map((candidate) => {
            const isActive = selected?.name === candidate.name;
            return (
              <CandidateButton
                key={candidate.name}
                type="button"
                $active={isActive}
                onClick={() => setSelected(candidate)}
              >
                <CandidateName>#{candidate.name}</CandidateName>
                {candidate.description && <CandidateDescription>{candidate.description}</CandidateDescription>}
              </CandidateButton>
            );
          })}
        </List>

        <Actions>
          <SecondaryButton type="button" onClick={onCancel}>
            Annulla
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => {
              if (selected) onConfirm(selected);
            }}
            disabled={!selected}
          >
            Conferma
          </PrimaryButton>
        </Actions>
      </Dialog>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(10, 16, 24, 0.62);
  display: grid;
  place-items: center;
  padding: 20px;
`;

const Dialog = styled.div`
  width: min(100%, 560px);
  max-height: min(90vh, 720px);
  overflow: auto;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(10, 16, 24, 0.28);
  padding: 24px;
  display: grid;
  gap: 18px;
`;

const Header = styled.div`
  display: grid;
  gap: 6px;
`;

const Title = styled.h3`
  margin: 0;
  color: #123126;
  font-size: 1.2rem;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #5c6b66;
  font-size: 0.92rem;
  line-height: 1.5;
`;

const List = styled.div`
  display: grid;
  gap: 10px;
`;

const CandidateButton = styled.button<{ $active: boolean }>`
  width: 100%;
  text-align: left;
  border: 1px solid ${({ $active }) => ($active ? "#216b58" : "#d9e4df")};
  background: ${({ $active }) => ($active ? "#ecfbf4" : "#ffffff")};
  border-radius: 18px;
  padding: 14px 16px;
  cursor: pointer;
  display: grid;
  gap: 4px;
`;

const CandidateName = styled.div`
  color: #123126;
  font-weight: 700;
`;

const CandidateDescription = styled.div`
  color: #61706b;
  font-size: 0.9rem;
  line-height: 1.45;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const SecondaryButton = styled.button`
  border: 1px solid #c9d7d2;
  background: #ffffff;
  color: #284238;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  border: 0;
  background: linear-gradient(135deg, #1f7a63, #2d9c73);
  color: #ffffff;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
