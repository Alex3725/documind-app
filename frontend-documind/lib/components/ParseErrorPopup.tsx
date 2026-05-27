"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import TagInput from "./TagInput";

export type SimpleTag = {
  name: string;
  description?: string;
};

type Props = {
  title?: string;
  tags: SimpleTag[];
  onAssign: (tag: SimpleTag) => void;
  onSkip: () => void;
};

export default function ParseErrorPopup({
  title = "Impossibile classificare il file",
  tags,
  onAssign,
  onSkip,
}: Props) {
  const [selectedTags, setSelectedTags] = useState<SimpleTag[]>([]);
  const sortedTags = useMemo(() => [...tags].sort((a, b) => a.name.localeCompare(b.name)), [tags]);

  return (
    <Overlay>
      <Dialog role="dialog" aria-modal="true" aria-labelledby="parse-error-title">
        <Header>
          <Title id="parse-error-title">{title}</Title>
          <Subtitle>La classificazione automatica non e riuscita. Seleziona un tag esistente o salta per lasciare il file senza tag.</Subtitle>
        </Header>

        <Field>
          <FieldLabel>Tag esistente</FieldLabel>
          <TagInput
            selected={selectedTags}
            onChange={setSelectedTags}
            tags={sortedTags}
            placeholder="#scrivi un tag"
            allowFreeText={false}
          />
        </Field>

        <Suggestions>
          <SuggestionsLabel>Suggerimenti</SuggestionsLabel>
          <SuggestionList>
            {sortedTags.slice(0, 8).map((tag) => (
              <SuggestionChip key={tag.name} type="button" onClick={() => setSelectedTags([tag])}>
                #{tag.name}
              </SuggestionChip>
            ))}
          </SuggestionList>
        </Suggestions>

        <Actions>
          <SecondaryButton type="button" onClick={onSkip}>
            Salta
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => {
              if (selectedTags[0]) onAssign(selectedTags[0]);
            }}
            disabled={!selectedTags[0]}
          >
            Assegna e riordina
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
  width: min(100%, 620px);
  max-height: min(90vh, 760px);
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

const Field = styled.div`
  display: grid;
  gap: 10px;
`;

const FieldLabel = styled.div`
  color: #286052;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Suggestions = styled.div`
  display: grid;
  gap: 10px;
`;

const SuggestionsLabel = styled.div`
  color: #286052;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const SuggestionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const SuggestionChip = styled.button`
  border: 1px solid #d5e2dd;
  background: #f7fbf9;
  color: #214236;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
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
